import { useEffect } from 'react';

export default function GoogleTranslate() {
    useEffect(() => {
        const id = 'google-translate-script';
        
        // Define translation callback globally
        window.googleTranslateElementInit = () => {
            if (window.google && window.google.translate) {
                new window.google.translate.TranslateElement({
                    pageLanguage: 'en',
                    includedLanguages: 'en,hi,te,ta,kn,ml,mr,gu,bn,pa,or,as,ur', // Major Indian languages
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
                }, 'google_translate_element');
            }
        };

        if (!document.getElementById(id)) {
            const addScript = document.createElement('script');
            addScript.setAttribute('id', id);
            addScript.setAttribute('type', 'text/javascript');
            addScript.setAttribute('src', 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit');
            document.body.appendChild(addScript);
        } else {
            // If script is already loaded, manually trigger setup
            if (window.google && window.google.translate) {
                window.googleTranslateElementInit();
            }
        }
    }, []);

    return (
        <div className="flex items-center">
            <div id="google_translate_element" className="min-w-[120px]" />
        </div>
    );
}
