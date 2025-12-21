<script lang="ts">
  import { onMount } from 'svelte';

  const username = 'MartinRybergLaude';
  const BLOCK_SIZE = 9.96;
  const BLOCK_MARGIN = 4;
  const FONT_SIZE = 14;

  const lightColors = ['#f5f4f0', '#a7e8dc', '#47baad', '#227f78', '#1d5250'];
  const darkColors = ['#0f0f0e', '#1d5250', '#227f78', '#47baad', '#a7e8dc'];

  type Day = { date: string; count: number; level: number };
  type Week = Day[];
  type ApiResponse = { contributions: { date: string; count: number; level: number }[] };

  let weeks: Week[] = $state([]);
  let loading = $state(true);
  let isDark = $state(false);
  let scrollContainer: HTMLDivElement | undefined = $state();

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function getColor(level: number): string {
    const colors = isDark ? darkColors : lightColors;
    return colors[Math.min(level, 4)];
  }

  function groupIntoWeeks(contributions: Day[]): Week[] {
    // Sort by date
    const sorted = [...contributions].sort((a, b) => a.date.localeCompare(b.date));

    // Find first Sunday to align weeks properly
    let startIndex = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (new Date(sorted[i].date).getDay() === 0) {
        startIndex = i;
        break;
      }
    }

    const aligned = sorted.slice(startIndex);
    const result: Week[] = [];

    for (let i = 0; i < aligned.length; i += 7) {
      result.push(aligned.slice(i, i + 7));
    }
    return result;
  }

  async function fetchContributions() {
    try {
      const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}`);
      const data: ApiResponse = await response.json();
      weeks = groupIntoWeeks(data.contributions);
    } catch (error) {
      console.error('Failed to fetch contributions:', error);
    } finally {
      loading = false;
    }
  }

  function scrollToEnd() {
    if (scrollContainer) {
      scrollContainer.scrollLeft = scrollContainer.scrollWidth;
    }
  }

  function getMonthLabels(): { month: string; x: number }[] {
    const labels: { month: string; x: number }[] = [];
    let currentMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0];
      if (firstDay) {
        const month = new Date(firstDay.date).getMonth();
        if (month !== currentMonth) {
          currentMonth = month;
          labels.push({
            month: months[month],
            x: weekIndex * (BLOCK_SIZE + BLOCK_MARGIN),
          });
        }
      }
    });

    return labels;
  }

  onMount(() => {
    isDark = document.documentElement.classList.contains('dark');

    const observer = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    fetchContributions().then(() => {
      setTimeout(scrollToEnd, 100);
    });

    return () => observer.disconnect();
  });

  const calendarWidth = $derived(weeks.length * (BLOCK_SIZE + BLOCK_MARGIN));
  const calendarHeight = $derived(7 * (BLOCK_SIZE + BLOCK_MARGIN) + 20);
  const monthLabels = $derived(getMonthLabels());
</script>

<div class="activity-calendar">
  {#if loading}
    <div class="loading" style="height: {calendarHeight}px">Loading...</div>
  {:else}
    <div bind:this={scrollContainer} class="scroll-container">
      <svg width={calendarWidth} height={calendarHeight} style="font-size: {FONT_SIZE}px">
        <g transform="translate(0, 20)">
          {#each weeks as week, weekIndex (weekIndex)}
            {#each week as day, dayIndex (day.date)}
              <rect
                x={weekIndex * (BLOCK_SIZE + BLOCK_MARGIN)}
                y={dayIndex * (BLOCK_SIZE + BLOCK_MARGIN)}
                width={BLOCK_SIZE}
                height={BLOCK_SIZE}
                rx="2"
                ry="2"
                fill={getColor(day.level)}
              >
                <title>{day.date}: {day.level} contributions</title>
              </rect>
            {/each}
          {/each}
        </g>
        <g class="month-labels">
          {#each monthLabels as label (label.x)}
            <text
              x={label.x}
              y="12"
              fill="currentColor"
              class="month-label"
            >
              {label.month}
            </text>
          {/each}
        </g>
      </svg>
    </div>
  {/if}
</div>

<style>
  .activity-calendar {
    width: 100%;
  }

  .scroll-container {
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.5;
  }

  .month-label {
    font-size: 12px;
    opacity: 0.7;
  }
</style>
