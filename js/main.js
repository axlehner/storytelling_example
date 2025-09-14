// Main D3 Scrollytelling Script
class ScrollytellingChart {
    constructor() {
        this.data = window.chartData;
        this.currentStep = 0;
        this.setupDimensions();
        this.setupScales();
        this.createChart();
        this.setupScrollTriggers();
        this.drawInitialChart();
    }

    setupDimensions() {
        this.margin = { top: 40, right: 40, bottom: 60, left: 60 };
        this.containerWidth = 600;
        this.containerHeight = 600;
        this.width = this.containerWidth - this.margin.left - this.margin.right;
        this.height = this.containerHeight - this.margin.top - this.margin.bottom;
        this.radius = Math.min(this.width, this.height) / 2 - 20;
    }

    setupScales() {
        // Bar chart scales
        this.xScale = d3.scaleBand()
            .domain(this.data.map(d => d.category))
            .range([0, this.width])
            .padding(0.1);

        this.yScale = d3.scaleLinear()
            .domain([0, d3.max(this.data, d => d.value)])
            .range([this.height, 0]);

        // Circular scales
        this.angleScale = d3.scaleBand()
            .domain(this.data.map(d => d.category))
            .range([0, 2 * Math.PI])
            .padding(0.05);

        this.radiusScale = d3.scaleLinear()
            .domain([0, d3.max(this.data, d => d.value)])
            .range([20, this.radius]);
    }

    createChart() {
        this.svg = d3.select('#main-chart')
            .attr('viewBox', `0 0 ${this.containerWidth} ${this.containerHeight}`)
            .style('background', 'transparent');

        this.chartGroup = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        // Create axes groups
        this.xAxisGroup = this.chartGroup.append('g')
            .attr('class', 'x-axis axis')
            .attr('transform', `translate(0, ${this.height})`);

        this.yAxisGroup = this.chartGroup.append('g')
            .attr('class', 'y-axis axis');

        // Create bars group
        this.barsGroup = this.chartGroup.append('g')
            .attr('class', 'bars-group');
    }

    drawInitialChart() {
        // Draw initial bar chart
        this.updateStep0();
    }

    updateStep0() {
        // Step 0: Basic bar chart
        const bars = this.barsGroup.selectAll('.bar')
            .data(this.data, d => d.category);

        bars.enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => this.xScale(d.category))
            .attr('y', this.height)
            .attr('width', this.xScale.bandwidth())
            .attr('height', 0)
            .attr('fill', d => d.color)
            .merge(bars)
            .transition()
            .duration(1000)
            .ease(d3.easeElastic.period(0.3))
            .attr('x', d => this.xScale(d.category))
            .attr('y', d => this.yScale(d.value))
            .attr('width', this.xScale.bandwidth())
            .attr('height', d => this.height - this.yScale(d.value))
            .attr('fill', d => d.color);

        // Show axes
        this.xAxisGroup.transition()
            .duration(800)
            .style('opacity', 1)
            .call(d3.axisBottom(this.xScale));

        this.yAxisGroup.transition()
            .duration(800)
            .style('opacity', 1)
            .call(d3.axisLeft(this.yScale));

        // Hide any circular elements
        this.chartGroup.selectAll('.arc-group').style('opacity', 0);
    }

    updateStep1() {
        // Step 1: Start bending the bars
        const bars = this.barsGroup.selectAll('.bar');
        
        bars.transition()
            .duration(1500)
            .ease(d3.easeCubicInOut)
            .attr('transform', (d, i) => {
                const angle = (i / this.data.length) * Math.PI * 0.3; // Slight curve
                const translateX = Math.sin(angle) * 20;
                return `translate(${translateX}, 0) skewX(${angle * 10})`;
            })
            .attr('fill', d => d3.color(d.color).brighter(0.3));

        // Fade axes slightly
        this.xAxisGroup.transition().duration(800).style('opacity', 0.5);
        this.yAxisGroup.transition().duration(800).style('opacity', 0.5);
    }

    updateStep2() {
        // Step 2: Transform to circular
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Remove old bars and create new arc elements
        this.barsGroup.selectAll('.bar')
            .transition()
            .duration(800)
            .style('opacity', 0)
            .remove();

        // Hide axes
        this.xAxisGroup.transition().duration(500).style('opacity', 0);
        this.yAxisGroup.transition().duration(500).style('opacity', 0);

        // Create arc generator
        const arc = d3.arc()
            .innerRadius(30)
            .outerRadius(d => this.radiusScale(d.value))
            .startAngle(d => this.angleScale(d.category))
            .endAngle(d => this.angleScale(d.category) + this.angleScale.bandwidth());

        // Create circular chart
        const arcGroup = this.chartGroup.selectAll('.arc-group')
            .data(this.data, d => d.category);

        const arcEnter = arcGroup.enter()
            .append('g')
            .attr('class', 'arc-group')
            .attr('transform', `translate(${centerX}, ${centerY})`);

        arcEnter.append('path')
            .attr('class', 'arc')
            .attr('fill', d => d.color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('d', arc)
            .style('opacity', 0);

        // Add labels
        arcEnter.append('text')
            .attr('class', 'arc-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('transform', d => {
                const angle = this.angleScale(d.category) + this.angleScale.bandwidth() / 2;
                const labelRadius = this.radiusScale(d.value) + 15;
                const x = Math.sin(angle) * labelRadius;
                const y = -Math.cos(angle) * labelRadius;
                return `translate(${x}, ${y})`;
            })
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .style('opacity', 0)
            .text(d => d.category);

        // Animate in
        this.chartGroup.selectAll('.arc')
            .transition()
            .delay((d, i) => i * 100)
            .duration(1000)
            .ease(d3.easeBackOut.overshoot(1.1))
            .style('opacity', 1);

        this.chartGroup.selectAll('.arc-label')
            .transition()
            .delay((d, i) => i * 100 + 500)
            .duration(800)
            .style('opacity', 1);
    }

    updateStep3() {
        // Step 3: Final polished circular chart
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Enhanced colors and effects
        this.chartGroup.selectAll('.arc')
            .transition()
            .duration(1000)
            .attr('fill', (d, i) => {
                const gradient = this.svg.select('defs').empty() ? 
                    this.svg.append('defs') : this.svg.select('defs');
                
                const gradientId = `gradient-${i}`;
                const linearGradient = gradient.selectAll(`#${gradientId}`)
                    .data([d])
                    .enter()
                    .append('linearGradient')
                    .attr('id', gradientId)
                    .attr('x1', '0%').attr('y1', '0%')
                    .attr('x2', '100%').attr('y2', '100%');

                linearGradient.append('stop')
                    .attr('offset', '0%')
                    .attr('stop-color', d.color);

                linearGradient.append('stop')
                    .attr('offset', '100%')
                    .attr('stop-color', d3.color(d.color).darker(1));

                return `url(#${gradientId})`;
            })
            .attr('stroke-width', 3)
            .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');

        // Add value labels
        const valueLabels = this.chartGroup.selectAll('.value-label')
            .data(this.data, d => d.category);

        valueLabels.enter()
            .append('text')
            .attr('class', 'value-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('transform', d => {
                const angle = this.angleScale(d.category) + this.angleScale.bandwidth() / 2;
                const valueRadius = this.radiusScale(d.value) / 2 + 30;
                const x = Math.sin(angle) * valueRadius + centerX - this.margin.left;
                const y = -Math.cos(angle) * valueRadius + centerY - this.margin.top;
                return `translate(${x}, ${y})`;
            })
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#fff')
            .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.5)')
            .style('opacity', 0)
            .text(d => d.value)
            .transition()
            .delay(500)
            .duration(800)
            .style('opacity', 1);
    }

    setupScrollTriggers() {
        const textSections = document.querySelectorAll('.text-section');
        
        const observerOptions = {
            root: null,
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Remove active class from all sections
                    textSections.forEach(section => section.classList.remove('active'));
                    
                    // Add active class to current section
                    entry.target.classList.add('active');
                    
                    // Get step number and update chart
                    const step = parseInt(entry.target.dataset.step);
                    this.updateChart(step);
                }
            });
        }, observerOptions);

        textSections.forEach(section => {
            observer.observe(section);
        });
    }

    updateChart(step) {
        if (step === this.currentStep) return;
        
        this.currentStep = step;
        
        switch(step) {
            case 0:
                this.updateStep0();
                break;
            case 1:
                this.updateStep1();
                break;
            case 2:
                this.updateStep2();
                break;
            case 3:
                this.updateStep3();
                break;
        }
    }
}

// Initialize the chart when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new ScrollytellingChart();
    
    // Add some interactive hover effects
    document.addEventListener('mousemove', function(e) {
        const chart = document.getElementById('main-chart');
        if (chart) {
            const rect = chart.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            chart.style.transform = `perspective(1000px) rotateY(${x * 2}deg) rotateX(${-y * 2}deg)`;
        }
    });
});