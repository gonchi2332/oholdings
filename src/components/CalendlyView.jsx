import { useEffect, useState } from 'react';
import { InlineWidget } from 'react-calendly';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { employeeService } from '../services/employee';
import { supabase } from '../lib/supabase';

export default function CalendlyView({ calendlyUrl, selectedEmployeeId, selectedCustomerId }) {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [employeeCalendlyUrl, setEmployeeCalendlyUrl] = useState(null);
    const [customerData, setCustomerData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Load employee Calendly URL from database if selectedEmployeeId is provided
    useEffect(() => {
        const loadEmployeeCalendlyUrl = async () => {
            if (selectedEmployeeId && !calendlyUrl) {
                try {
                    setLoading(true);
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('calendly_url')
                        .eq('id', selectedEmployeeId)
                        .single();
                    
                    if (!error && profile?.calendly_url) {
                        setEmployeeCalendlyUrl(profile.calendly_url);
                    }
                } catch (error) {
                    console.error('Error loading employee Calendly URL:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadEmployeeCalendlyUrl();
    }, [selectedEmployeeId, calendlyUrl]);

    // Load customer data if selectedCustomerId is provided (for employee booking)
    useEffect(() => {
        const loadCustomerData = async () => {
            if (selectedCustomerId) {
                try {
                    const customer = await employeeService.getCustomerById(selectedCustomerId);
                    setCustomerData(customer);
                } catch (error) {
                    console.error('Error loading customer data:', error);
                }
            }
        };
        loadCustomerData();
    }, [selectedCustomerId]);

    // Configure prefill data
    // If customer data is provided (employee booking), use customer data
    // Otherwise, use current user data
    // IMPORTANT: All values must be valid strings (not null, undefined, or objects)
    const getSafeString = (value) => {
        if (!value) return '';
        if (typeof value === 'string') return value.trim();
        return String(value).trim();
    };

    // Build prefill object only if we have valid data
    // Only include properties that have non-empty string values
    const buildPrefill = () => {
        if (customerData) {
            const name = getSafeString(customerData.full_name);
            const email = getSafeString(customerData.email);
            const prefillObj = {};
            if (name) prefillObj.name = name;
            if (email) prefillObj.email = email;
            return Object.keys(prefillObj).length > 0 ? prefillObj : null;
        } else if (user) {
            const name = getSafeString(user.user_metadata?.full_name || user.email);
            const email = getSafeString(user.email);
            const prefillObj = {};
            if (name) prefillObj.name = name;
            if (email) prefillObj.email = email;
            return Object.keys(prefillObj).length > 0 ? prefillObj : null;
        }
        return null;
    };

    const prefill = buildPrefill();

    // Add custom parameters for styling (matching your mineral-green theme)
    // Show event type details so employee can select the type of meeting
    const pageSettings = {
        backgroundColor: isDark ? '1f2937' : 'ffffff',
        hideEventTypeDetails: false, // Show event types so employee can select
        hideLandingPageDetails: false, // Show landing page for better UX
        primaryColor: '00a86b', // mineral-green color
        textColor: isDark ? 'f9fafb' : '4d5055'
    };

    const utm = {
        utmCampaign: 'OHoldings',
        utmSource: 'website',
        utmMedium: 'embed'
    };

    // Determine the URL to use
    // Priority: 1. calendlyUrl prop, 2. Employee-specific URL from DB, 3. Environment variable, 4. Default
    // Ensure URL is a valid string
    let url = calendlyUrl || employeeCalendlyUrl;
    
    if (!url || typeof url !== 'string') {
        url = import.meta.env.VITE_CALENDLY_DEFAULT_URL || 'https://calendly.com/your-username/consultation';
    }
    
    // Ensure URL is a valid string
    url = String(url).trim();

    // Add URL parameters to hide event type details and organizer/host name
    // Also add customer email and name as URL parameters for Calendly
    let finalUrl = '';
    if (url && typeof url === 'string' && url.trim()) {
        try {
            const urlWithParams = new URL(url.trim());
            
            // Remove any existing email/name params to avoid duplicates
            urlWithParams.searchParams.delete('email');
            urlWithParams.searchParams.delete('name');
            urlWithParams.searchParams.delete('a1');
            
            // Remove UI hiding parameters to show event types and allow selection
            // This allows the employee to see and select the type of meeting
            urlWithParams.searchParams.delete('hide_event_type_details');
            urlWithParams.searchParams.delete('hide_landing_page_details');
            
            finalUrl = urlWithParams.toString();
        } catch (error) {
            console.error('Invalid Calendly URL:', error, 'Original URL:', url);
            // Fallback to original URL if it's a valid string
            finalUrl = typeof url === 'string' ? url.trim() : '';
        }
    }

    // Use effect to manipulate iframe after load (for hiding name and adjusting scroll)
    useEffect(() => {
        const hideOrganizerName = () => {
            const iframe = document.querySelector('.calendly-inline-widget iframe');
            if (!iframe) return;

            // Try to access iframe content (may fail due to CORS)
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc) {
                    // Comprehensive selectors for all possible organizer name locations
                    const selectors = [
                        // Event type and organizer name selectors
                        '[class*="EventTypeName"]',
                        '[class*="event-type-name"]',
                        '[class*="OrganizerName"]',
                        '[class*="organizer-name"]',
                        '[class*="HostName"]',
                        '[class*="host-name"]',
                        '[class*="Host"]',
                        '[class*="host"]',
                        'h1[class*="event"]',
                        'h2[class*="event"]',
                        'h3[class*="event"]',
                        '[data-event-type-name]',
                        '[data-organizer-name]',
                        '.event-type-name',
                        // Enter Details page specific selectors
                        '[class*="EventTypeDetails"]',
                        '[class*="event-type-details"]',
                        '[class*="Details"]',
                        '[class*="details"]',
                        '[class*="FormHeader"]',
                        '[class*="form-header"]',
                        // Generic selectors that might contain organizer name
                        '*[class*="EventType"]',
                        'p',
                        'span',
                        'div[class*="text"]',
                        'div[class*="title"]',
                        'div[class*="header"]',
                    ];
                    
                    // Function to hide element if it contains organizer name
                    const hideIfContainsName = (el) => {
                        const text = el.textContent || '';
                        const innerHTML = el.innerHTML || '';
                        
                        // Check for organizer name patterns
                        if (text.includes('Rodrigo') || 
                            text.includes('Luque') || 
                            text.includes('Tames') ||
                            innerHTML.includes('Rodrigo') ||
                            innerHTML.includes('Luque')) {
                            
                            el.style.display = 'none';
                            el.style.visibility = 'hidden';
                            el.style.height = '0';
                            el.style.overflow = 'hidden';
                            el.style.opacity = '0';
                            el.style.position = 'absolute';
                            el.style.width = '0';
                            el.setAttribute('aria-hidden', 'true');
                            return true;
                        }
                        return false;
                    };
                    
                    // Try all selectors
                    selectors.forEach(selector => {
                        try {
                            const elements = iframeDoc.querySelectorAll(selector);
                            elements.forEach(el => {
                                hideIfContainsName(el);
                                
                                // Also check child elements
                                const children = el.querySelectorAll('*');
                                children.forEach(child => {
                                    hideIfContainsName(child);
                                });
                            });
                        } catch {
                            // Ignore selector errors
                        }
                    });
                    
                    // Also search all text nodes directly
                    const walker = iframeDoc.createTreeWalker(
                        iframeDoc.body,
                        NodeFilter.SHOW_TEXT,
                        null
                    );
                    
                    let node = walker.nextNode();
                    while (node) {
                        if (node.textContent.includes('Rodrigo') || 
                            node.textContent.includes('Luque')) {
                            const parent = node.parentElement;
                            if (parent) {
                                hideIfContainsName(parent);
                            }
                        }
                        node = walker.nextNode();
                    }
                }
            } catch {
                // CORS restriction - can't access iframe content
                // This is expected - we rely on URL parameters and pageSettings instead
            }
        };

        // Track previous URL to detect page changes
        let previousIframeSrc = '';
        
        // Function to detect page changes within the iframe
        const detectPageChange = () => {
            const iframe = document.querySelector('.calendly-inline-widget iframe');
            if (!iframe) return;
            
            try {
                const currentSrc = iframe.src || '';
                const iframeWindow = iframe.contentWindow;
                
                // Check if URL changed (indicates page navigation)
                if (currentSrc !== previousIframeSrc) {
                    previousIframeSrc = currentSrc;
                    // Page changed, re-apply hiding after a delay
                    setTimeout(hideOrganizerName, 500);
                    setTimeout(hideOrganizerName, 1000);
                    setTimeout(hideOrganizerName, 2000);
                }
                
                // Try to detect internal navigation by checking iframe document
                try {
                    const iframeDoc = iframe.contentDocument || iframeWindow?.document;
                    if (iframeDoc) {
                        // Check for page change indicators
                        const pageTitle = iframeDoc.title || '';
                        const url = iframeWindow?.location?.href || '';
                        
                        // Re-apply hiding when entering "Enter Details" page
                        if (pageTitle.includes('Details') || url.includes('details')) {
                            setTimeout(hideOrganizerName, 300);
                            setTimeout(hideOrganizerName, 800);
                            setTimeout(hideOrganizerName, 1500);
                        }
                    }
                } catch {
                    // CORS - can't access iframe content directly
                }
            } catch {
                // Ignore errors
            }
        };

        // Wait for widget to load and check periodically
        const checkAndHide = () => {
            const iframe = document.querySelector('.calendly-inline-widget iframe');
            if (iframe) {
                iframe.addEventListener('load', () => {
                    hideOrganizerName();
                    detectPageChange();
                });
                
                // Also try after delays to catch dynamically loaded content
                setTimeout(() => {
                    hideOrganizerName();
                    detectPageChange();
                }, 500);
                setTimeout(() => {
                    hideOrganizerName();
                    detectPageChange();
                }, 1000);
                setTimeout(() => {
                    hideOrganizerName();
                    detectPageChange();
                }, 2000);
                setTimeout(() => {
                    hideOrganizerName();
                    detectPageChange();
                }, 3000);
                setTimeout(() => {
                    hideOrganizerName();
                    detectPageChange();
                }, 5000);
            }
        };

        // Observer for external DOM changes (iframe added/removed)
        const observer = new MutationObserver(() => {
            checkAndHide();
            // Also run hide function when mutations occur
            setTimeout(hideOrganizerName, 100);
            detectPageChange();
        });

        observer.observe(document.body, { childList: true, subtree: true });
        
        // Observer specifically for iframe changes
        let iframeObserver = null;
        const setupIframeObserver = () => {
            const iframe = document.querySelector('.calendly-inline-widget iframe');
            if (iframe && iframe.contentWindow) {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc && iframeDoc.body) {
                        // Observe changes inside the iframe (page navigation)
                        iframeObserver = new MutationObserver(() => {
                            hideOrganizerName();
                            detectPageChange();
                        });
                        
                        iframeObserver.observe(iframeDoc.body, {
                            childList: true,
                            subtree: true,
                            attributes: true,
                            attributeFilter: ['class', 'style']
                        });
                    }
                } catch {
                    // CORS - can't observe iframe content
                }
            }
        };
        
        // Initial check
        checkAndHide();
        
        // Setup iframe observer after a delay
        setTimeout(setupIframeObserver, 1000);
        setTimeout(setupIframeObserver, 3000);
        
        // Set up interval to periodically check and detect page changes
        const intervalId = setInterval(() => {
            hideOrganizerName();
            detectPageChange();
            setupIframeObserver();
        }, 2000);

        return () => {
            observer.disconnect();
            if (iframeObserver) {
                iframeObserver.disconnect();
            }
            clearInterval(intervalId);
        };
    }, [finalUrl, employeeCalendlyUrl]);


    // Show loading state while fetching employee Calendly URL
    if (loading && !url) {
        return (
            <div className="flex justify-center items-center h-900px">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mineral-green"></div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                /* Ensure Calendly widget container has fixed height - NO SCROLL on container */
                .calendly-container-wrapper {
                    height: 900px !important;
                    min-height: 900px !important;
                    max-height: 900px !important;
                    overflow: hidden !important;
                    position: relative !important;
                }
                
                /* Ensure Calendly widget takes full height without scroll on container */
                .calendly-inline-widget {
                    height: 900px !important;
                    min-height: 900px !important;
                    max-height: 900px !important;
                    overflow: hidden !important;
                    position: relative !important;
                }
                
                .calendly-inline-widget iframe {
                    height: 900px !important;
                    min-height: 900px !important;
                    width: 100% !important;
                    border: none !important;
                    /* Allow iframe to handle internal scroll for time slots only */
                    overflow: auto !important;
                    /* Prevent external scrollbars */
                    scrolling: auto !important;
                }
                
                /* Prevent body scroll when hovering over calendly widget */
                .calendly-container-wrapper {
                    touch-action: pan-y;
                }
                
                /* Dark mode styling - apply filter to iframe for dark theme */
                ${isDark ? `
                    .calendly-inline-widget iframe {
                        filter: invert(1) hue-rotate(180deg) brightness(0.92) contrast(1.05);
                    }
                ` : ''}
                
                /* Hide event type name and organizer name - using CSS that might work */
                /* Note: Direct CSS manipulation of iframe content is limited by CORS, 
                   so we rely on URL parameters and pageSettings primarily */
            `}</style>
            {finalUrl ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 w-full calendly-container-wrapper">
                    <InlineWidget
                        url={finalUrl}
                        styles={{
                            height: '900px',
                            minWidth: '320px',
                            width: '100%'
                        }}
                        pageSettings={pageSettings}
                        {...(prefill ? { prefill } : {})}
                        utm={utm}
                    />
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        No se ha configurado una URL de Calendly. Por favor, contacta al administrador.
                    </p>
                </div>
            )}
        </>
    );
}

