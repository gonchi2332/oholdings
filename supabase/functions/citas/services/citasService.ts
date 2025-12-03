import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { AppointmentCreatePayload, AppointmentUpdatePayload } from "../types/types.ts"
import { validateAppointmentDate, validateDuration, validateStringLength, sanitizeString, isValidUUID } from "../utils/validation.ts"

export class CitasService {
    constructor(private supabase: SupabaseClient, private userId: string, private isEmployee: boolean) {}

    async createAppointment(payload: AppointmentCreatePayload) {
        // Validaciones
        const validationError = this.validateCreatePayload(payload)
        if (validationError) {
            throw new Error(validationError)
        }

        // Determinar user_id y employee_id
        const { targetUserId, targetEmployeeId } = this.determineUserIds(payload)

        // Validar fecha/hora
        const dateError = validateAppointmentDate(payload.fecha_consulta)
        if (dateError) {
            throw new Error(dateError)
        }

        // Calcular fechas
        const startDate = new Date(payload.fecha_consulta)
        const duration = validateDuration(payload.duracion_consulta)
        const endDate = new Date(startDate.getTime() + duration.minutes * 60 * 1000)

        // Verificar conflictos
        await this.checkConflicts(targetEmployeeId, startDate, endDate)

        // Obtener status_id
        const statusId = await this.getStatusId(this.isEmployee ? 'approved' : 'pending')

        // Verificar que tipo_consulta_id y modalidad_id existen
        await this.verifyReferences(payload.tipo_consulta_id, payload.modalidad_id)

        // Insertar
        const { data, error } = await this.supabase
            .from('citas')
            .insert([{
                user_id: targetUserId,
                empresa: payload.empresa ? sanitizeString(payload.empresa) : undefined,
                tipo_consulta_id: payload.tipo_consulta_id,
                descripcion: payload.descripcion ? sanitizeString(payload.descripcion) : undefined,
                fecha_consulta: startDate.toISOString(),
                end_time: endDate.toISOString(),
                modalidad_id: payload.modalidad_id,
                direccion: payload.direccion ? sanitizeString(payload.direccion) : undefined,
                employee_id: targetEmployeeId,
                status_id: statusId,
                created_by_employee: this.isEmployee
            }])
            .select(`
                *,
                tipo_consulta:tipos_consulta!citas_tipo_consulta_id_fkey(name),
                modalidad:modalidades!citas_modalidad_id_fkey(name),
                status:status_citas!citas_status_id_fkey(name)
            `)
            .single()

        if (error) throw error
        return data
    }

    async getAppointments(requestedEmployeeId: string | null) {
        const { data: approvedStatus } = await this.supabase
            .from('status_citas')
            .select('id')
            .eq('name', 'approved')
            .single()

        const { data: rejectedStatus } = await this.supabase
            .from('status_citas')
            .select('id')
            .eq('name', 'rejected')
            .single()

        let query = this.supabase
            .from('citas')
            .select(`
                *,
                employee:profiles!citas_employee_id_fkey(
                    full_name, 
                    specialty:specialties!profiles_specialty_id_fkey(name)
                ),
                tipo_consulta:tipos_consulta!citas_tipo_consulta_id_fkey(name),
                modalidad:modalidades!citas_modalidad_id_fkey(name),
                status:status_citas!citas_status_id_fkey(name)
            `)
            .order('fecha_consulta', { ascending: true })

        if (this.isEmployee) {
            // Employees can only see their own appointments
            query = query.eq('employee_id', this.userId)
        } else {
            // Regular users (customers)
            if (requestedEmployeeId) {
                // If requesting appointments for a specific specialist, show approved appointments of that specialist
                query = query.eq('employee_id', requestedEmployeeId).eq('status_id', approvedStatus?.id)
            } else {
                // Otherwise, show their own appointments
                query = query.eq('user_id', this.userId)
            }
        }

        const { data, error } = await query
        if (error) throw error

        // Auto-reject past appointments
        const now = new Date()
        const pastAppointments = (data || []).filter(apt => {
            const appointmentDate = new Date(apt.fecha_consulta)
            const currentStatusName = apt.status?.name || 'pending'
            return appointmentDate < now && currentStatusName !== 'rejected'
        })

        if (pastAppointments.length > 0 && rejectedStatus?.id) {
            const pastIds = pastAppointments.map(apt => apt.id)
            const { error: updateError } = await this.supabase
                .from('citas')
                .update({ status_id: rejectedStatus.id })
                .in('id', pastIds)
            
            if (updateError) {
                console.error('Error auto-rejecting past appointments:', updateError)
            } else {
                // Update the data array to reflect the new status
                data?.forEach(apt => {
                    if (pastIds.includes(apt.id)) {
                        apt.status_id = rejectedStatus.id
                        apt.status = { name: 'rejected' }
                    }
                })
            }
        }

        return { appointments: data, isEmployee: this.isEmployee }
    }

    async updateAppointment(payload: AppointmentUpdatePayload) {
        // Validaciones
        if (!isValidUUID(payload.id)) {
            throw new Error('Invalid appointment ID format')
        }

        if (typeof payload.status_name !== 'string' || !['pending', 'approved', 'rejected'].includes(payload.status_name)) {
            throw new Error('Invalid status value')
        }

        // Obtener status_id
        const { data: statusData, error: statusError } = await this.supabase
            .from('status_citas')
            .select('id')
            .eq('name', payload.status_name)
            .single()

        if (statusError || !statusData) {
            throw new Error('Invalid status')
        }

        // Verificar permisos
        await this.checkUpdatePermission(payload.id)

        // Actualizar
        const { data, error } = await this.supabase
            .from('citas')
            .update({ status_id: statusData.id })
            .eq('id', payload.id)
            .select(`
                *,
                tipo_consulta:tipos_consulta!citas_tipo_consulta_id_fkey(name),
                modalidad:modalidades!citas_modalidad_id_fkey(name),
                status:status_citas!citas_status_id_fkey(name)
            `)
            .single()

        if (error) throw error
        return data
    }

    async deleteAppointment(id: string) {
        if (!isValidUUID(id)) {
            throw new Error('Invalid appointment ID format')
        }

        if (!this.isEmployee) {
            throw new Error('Forbidden: Customers cannot delete appointments')
        }

        const { error } = await this.supabase
            .from('citas')
            .delete()
            .eq('id', id)

        if (error) throw error
        return { message: 'Deleted successfully' }
    }

    // Métodos privados de ayuda
    private validateCreatePayload(payload: AppointmentCreatePayload): string | null {
        if (!payload.fecha_consulta) return 'Date is required'
        if (!payload.tipo_consulta_id) return 'Consultation type is required'
        if (!payload.modalidad_id) return 'Modality is required'

        if (!isValidUUID(payload.tipo_consulta_id)) {
            return 'Invalid consultation type ID format'
        }
        if (!isValidUUID(payload.modalidad_id)) {
            return 'Invalid modality ID format'
        }
        if (payload.employee_id && !isValidUUID(payload.employee_id)) {
            return 'Invalid employee ID format'
        }
        if (payload.user_id && !isValidUUID(payload.user_id)) {
            return 'Invalid user ID format'
        }

        const empresaError = validateStringLength(payload.empresa, 200, 'Company name')
        if (empresaError) return empresaError

        const descripcionError = validateStringLength(payload.descripcion, 1000, 'Description')
        if (descripcionError) return descripcionError

        const direccionError = validateStringLength(payload.direccion, 500, 'Address')
        if (direccionError) return direccionError

        const duration = validateDuration(payload.duracion_consulta)
        if (!duration.valid) {
            return duration.error || 'Invalid duration'
        }

        return null
    }

    private determineUserIds(payload: AppointmentCreatePayload): { targetUserId: string, targetEmployeeId: string } {
        if (this.isEmployee) {
            if (!payload.user_id) {
                throw new Error('Client (user_id) is required for employee booking')
            }
            return {
                targetUserId: payload.user_id,
                targetEmployeeId: this.userId
            }
        } else {
            if (!payload.employee_id) {
                throw new Error('Employee is required')
            }
            return {
                targetUserId: this.userId,
                targetEmployeeId: payload.employee_id
            }
        }
    }

    private async checkConflicts(employeeId: string, startDate: Date, endDate: Date) {
        const { data: approvedStatus } = await this.supabase
            .from('status_citas')
            .select('id')
            .eq('name', 'approved')
            .single()

        const { data: conflicts, error } = await this.supabase
            .from('citas')
            .select('id')
            .eq('employee_id', employeeId)
            .eq('status_id', approvedStatus?.id)
            .lt('fecha_consulta', endDate.toISOString())
            .gt('end_time', startDate.toISOString())

        if (error) throw error
        if (conflicts && conflicts.length > 0) {
            throw new Error('Este horario ya está ocupado. Por favor selecciona otro horario.')
        }
    }

    private async getStatusId(statusName: string): Promise<string> {
        const { data, error } = await this.supabase
            .from('status_citas')
            .select('id')
            .eq('name', statusName)
            .single()

        if (error || !data) {
            throw new Error('Failed to determine appointment status')
        }
        return data.id
    }

    private async verifyReferences(tipoConsultaId: string, modalidadId: string) {
        const [tipoConsulta, modalidad] = await Promise.all([
            this.supabase.from('tipos_consulta').select('id').eq('id', tipoConsultaId).single(),
            this.supabase.from('modalidades').select('id').eq('id', modalidadId).single()
        ])

        if (tipoConsulta.error || !tipoConsulta.data) {
            throw new Error('Invalid consultation type')
        }
        if (modalidad.error || !modalidad.data) {
            throw new Error('Invalid modality')
        }
    }

    private async checkUpdatePermission(appointmentId: string) {
        const { data: appointment, error } = await this.supabase
            .from('citas')
            .select('user_id, employee_id, created_by_employee')
            .eq('id', appointmentId)
            .single()

        if (error) throw error

        if (this.isEmployee) {
            if (appointment.employee_id !== this.userId) {
                throw new Error('Forbidden: You can only update your own appointments')
            }
        } else {
            // Regular users can only update appointments that were created by employees
            if (appointment.user_id !== this.userId) {
                throw new Error('Forbidden: You can only update your own appointments')
            }
            if (!appointment.created_by_employee) {
                throw new Error('Forbidden: You can only accept/reject appointments created by employees')
            }
        }
    }
}

