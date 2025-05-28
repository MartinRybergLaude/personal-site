import GitHubCalendar from "react-github-calendar";
import { useEffect } from "react";

export default function Contributions() {
    useEffect(() => {
        const scrollToEnd = () => {
            const scrollContainer = document.querySelector('.react-activity-calendar__scroll-container') as HTMLElement;
            if (scrollContainer) {
                scrollContainer.scrollLeft = scrollContainer.scrollWidth;
            }
        };

        const timeoutId = setTimeout(scrollToEnd, 100);

        const observer = new MutationObserver(() => {
            setTimeout(scrollToEnd, 50);
        });

        const calendarContainer = document.querySelector('.react-activity-calendar');
        if (calendarContainer) {
            observer.observe(calendarContainer, { childList: true, subtree: true });
        }

        return () => {
            clearTimeout(timeoutId);
            observer.disconnect();
        };
    }, []);

    return <GitHubCalendar 
        username="MartinRybergLaude" 
        theme={{
            light: ['#f5f4f0', '#a7e8dc', "#47baad", "#227f78", "#1d5250"],
            dark: ['#0f0f0e', '#1d5250', "#227f78", "#47baad", "#a7e8dc"],
        }} 
        blockSize={9.96} 
        blockMargin={4} 
        fontSize={14}
    />
}