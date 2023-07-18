function build_heatmap(aggregated) {
    heatmap_container = document.getElementById("heatmap")
    heatmap_container.innerHTML = '';

    const heatmap_element = window.getComputedStyle(heatmap_container);
    const width = parseInt(heatmap_element.getPropertyValue('width'));
    // const y_labels_width = (0.5 / 10) * width;
    const y_labels_width = 0;
    const x_labels_height = 3 * y_labels_width;
    const cellSize = (9 / 10) * ((width - y_labels_width) / 15);
    const cellPadding = 1 / 10 * cellSize
    // const height = (cellSize) * 4 + 3 * cellPadding + x_labels_height
    const height = (1 / 3) * width




    const data = aggregated.timeframes.map((timeframe, index) => {
        timeframe.time_frame_center = luxon.DateTime.fromISO(timeframe.time_frame_center).setZone(aggregated.timezone)
        timeframe.index = index
        return timeframe
    })


    const svg = d3.select('#heatmap')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
    // .attr('transform', 'translate(0 -50)')


    const cells_group = svg.append('g')
        .attr('transform', `translate(${y_labels_width}, ${(cellSize / 2)})`)
    const moonIconGroup = svg.append('g')
        .attr('transform', `translate(${y_labels_width}, ${(cellSize / 2)})`)

    const colorScale = d3.scaleLinear()
        .domain([0, 1])
        .range(["#d9d9d9", "#1a9641"])
        .interpolate(d3.interpolateRgb);


    const x_labels = [...new Set(data.map(data => {
        return data.time_frame_center.toFormat('MMM dd');
    }))].map((label, index) => {
        return { 'i': index, 'label': label }
    })


    let y_labels = []
    for (let i = 0; i < aggregated.nb_of_timeframes_per_cycle; i++) {
        y_labels.push({ 'i': aggregated.nb_of_timeframes_per_cycle - i, 'time': `${data[i].time_frame_center.minus({ 'hours': 1, 'minutes': 30 }).hour.toString().padStart(2, '0')}:00` })
    }
    y_labels.push({ 'i': 0, 'time': `${data[aggregated.nb_of_timeframes_per_cycle - 1].time_frame_center.plus({ 'hours': 1, 'minutes': 30 }).hour.toString().padStart(2, '0')}:00` })


    cells_group.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('x', function (d) {
            const col = Math.floor(d.index / 4)
            return col * (cellSize + cellPadding) + cellPadding;
        })
        .attr('y', function (d) {
            const hour = d.time_frame_center.hour
            let row;
            if (hour == 18) { row = 3 }
            if (hour == 21) { row = 2 }
            if (hour == 0) { row = 1 }
            if (hour == 3) { row = 0 }
            return (row) * (cellSize + cellPadding);
        })
        .attr('fill', function (d) {
            return d ? colorScale(d.suit.overall) : '#eee';
        })
        .on("mouseover", function (event, d) {
            d3.select(this)
                .attr("fill", d3.interpolateRgb(this.getAttribute('fill'), "#ffffff")(0.6))
            tooltip.style("visibility", "visible")
                .html(build_tooltip(d, aggregated.time_frame_len, aggregated.timezone_abbreviation))
                .style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px"); // Update the tooltip position
        }).on("mouseout", function () {
            d3.select(this).attr('fill', function (d) {
                return d ? colorScale(d.suit.overall) : '#eee';
            })
            tooltip.style("visibility", "hidden"); // Hide the tooltip

        })
        .on("click", function (event, d) {
            console.log(d)
            cells_group.selectAll('rect').attr('class', null)
            d3.select(this)
                .attr('class', "selected")

            build_skymap(d.time_frame_center.toISO(), aggregated.latitude, aggregated.longitude, aggregated.elevation, aggregated.timezone);
        })



    moonIconGroup.selectAll('moon-icons')
        .data(data)
        .enter()
        .append('text')
        .style('font-size', 'x-small')
        .style("filter", "grayscale(100%)")
        .attr('text-anchor', 'end')
        .attr('transform', function (d) {
            if (d.moon.altitude > 0) {
                let index;
                for (let i in data) {
                    let item = data[i]
                    if (item.time_frame_center == d.time_frame_center) { index = i }
                }
                const col = Math.floor(index / 4)
                const x_cell_bot_right = col * (cellSize + cellPadding) + cellSize;

                const hour = d.time_frame_center.hour
                let row;
                if (hour == 18) { row = 3 }
                if (hour == 21) { row = 2 }
                if (hour == 0) { row = 1 }
                if (hour == 3) { row = 0 }
                const y_cell_bot_right = (row) * (cellSize + cellPadding) + cellSize;

                // -x because the moon emoji hangs below the baseline
                return `translate(${x_cell_bot_right - 1} ${y_cell_bot_right - 3})`
            }
        })
        .text(function (d) {
            if (d.moon.altitude > 0) {
                return ['🌑︎', '🌒︎', '🌓︎', '🌔︎', '🌕︎', '🌖︎', '🌗︎', '🌘︎'][Math.round(d.moon.phase_angle / 45) % 8]
            }
        })
        .attr('font-family', 'monospace')
        .attr("opacity", 0.5);


    // Create the tooltip element
    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "hovertip text")

    // svg.selectAll("y-label")
    //     .data(y_labels)
    //     .enter()
    //     .append('text')
    //     .attr('font-family', 'monospace')
    //     .attr('font-size', 'small')
    //     .attr('text-anchor', 'end')
    //     .attr('alignment-baseline', 'middle')
    //     .attr('x', y_labels_width - 10)
    //     .attr('y', function (d) {
    //         return d.i * (cellSize + cellPadding) + (cellSize / 2);
    //     })
    //     .text(function (d) { return d.time });

    svg.selectAll("x-labels1")
        .data(x_labels.slice(0, x_labels.length - 1))
        .enter()
        .append('text')
        .attr('font-family', 'monospace')
        .attr('font-size', 'x-small')
        .attr('text-anchor', 'begin')
        .attr('alignment-baseline', 'hanging')
        .attr('transform', function (d) {
            let x = ((parseInt(d.i)) * (cellSize + cellPadding)) + cellPadding;
            let y = 4 * (cellSize + cellPadding) + (cellSize / 2);
            return `translate(${x} ${y})`;
        })
        .text(function (d) { return d.label });

    svg.selectAll("x-labels2")
        .data(x_labels.slice(1, x_labels.length))
        .enter()
        .append('text')
        .attr('font-family', 'monospace')
        .attr('font-size', 'x-small')
        .attr('text-anchor', 'end')
        // .attr('alignment-baseline', 'hanging')
        .attr('transform', function (d) {
            console.log(d)
            let x = ((parseInt(d.i)) * (cellSize + cellPadding));
            let y = cellSize / 2 - cellPadding;
            return `translate(${x} ${y})`;
        })
        .text(function (d) { return d.label });

}

function get_cloudcover_info_str(cloudcover) {
    /** Builds an informational string about the cloudcover.
     * 
     * @param {number} cloudcover percentage of the sky 
     * that is covered in clouds.
     * 
     * @returns {String} An informational string.
     */

    if (cloudcover == 0) { return `Clear (${cloudcover.toFixed()} %) ✴⁺☄˚⋆˙` }
    if (cloudcover < 15) { return `Mostly Clear (${cloudcover.toFixed()} %) ˚☁⋆˙✴⁺` }
    if (cloudcover > 80) { return `Covered in Clouds (${cloudcover.toFixed()} %) ☁☁☁` }
    return `Partially Covered in Clouds (${cloudcover.toFixed()} %) ˙☁︎.⁺☁⋆`
}


function get_moon_phase_info_str(angle) {
    /** Builds an informational string about the moon phase
     * from the given moon phase angle.
     * 
     * @param {number} angle The angle of the moon phase [0 to 360), 
     * 0 -> New Moon, 180 -> Full Moon.
     * 
     * @returns {String} An informational string containing a moon emoji.
     */
    const strings = [
        `New Moon (${angle.toFixed()}°) 🌑︎`, // New Moon
        `Waxing Crescent Moon (${angle.toFixed()}°) 🌒︎`, // Waxing Crescent Moon
        `First Quarter Moon (${angle.toFixed()}°) 🌓︎`, // First Quarter Moon
        `Waxing Gibbous Moon (${angle.toFixed()}°) 🌔︎`, // Waxing Gibbous Moon
        `Full Moon (${angle.toFixed()}°) 🌕︎`, // Full Moon
        `Waning Gibbous Moon (${angle.toFixed()}°) 🌖︎`, // Waning Gibbous Moon
        `Last Quarter Moon (${angle.toFixed()}°) 🌗︎`, // Last Quarter Moon
        `Waning Crescent Moon  (${angle.toFixed()}°) 🌘︎`, // Waning Crescent Moon
    ];

    // Calculate the moon phase index based on the angle
    const phase_index = Math.round(angle / 45) % 8;

    // Return the corresponding moon emoji
    return strings[phase_index];
}


function get_moon_alt_info_str(angle, rising) {
    /** Builds an informational string about the moon altitude
     * from the given moon altitude angle.
     * 
     * @param {number} angle The angle of the moon altitude (-180 to 180), 
     * negative values indication moon position below horizon
     * @param {number} rising Boolean that indicates if the moon is rising.
     * 
     * @returns {String} An informational string.
     */

    let stage;
    if (0 >= angle && angle > -6) { stage = 'Civil'; }
    if (-6 >= angle && angle > -12) { stage = 'Nautical'; }
    if (-12 >= angle && angle > -18) { stage = 'Astronomical'; }
    if (rising) { stage += ' Moonrise' }
    else { stage += ' Moonset' }
    if (angle <= -18) { stage = 'Moon is set' }
    if (angle > 0) { stage = 'Moon is up' }

    stage += ` (${angle.toFixed(1)}°)`

    return stage
}

function get_sun_alt_info_str(angle, rising) {
    /** Builds an informational string about the sun altitude
     * from the given sun altitude angle.
     * 
     * @param {number} angle The angle of the sun altitude (-180 to 180), 
     * negative values indication sun position below horizon
     * @param {number} rising Boolean that indicates if the sun is rising.
     * 
     * @returns {String} An informational string.
     */


    let stage;
    if (-6 >= angle && angle > -12) { stage = 'Civil'; }
    if (-12 >= angle && angle > -18) { stage = 'Nautical'; }
    if (-18 >= angle && angle > -24) { stage = 'Astronomical'; }
    if (rising) { stage += ' Dawn' }
    else { stage += ' Dusk' }
    if (angle <= -24) { stage = 'Night' }
    if (angle > -6) { stage = 'Day' }

    stage += ` (${angle.toFixed(1)}°)`

    return stage
}

function build_tooltip(timeframe, time_frame_len_hours, timezone) {
    const time_frame_begin = timeframe.time_frame_center.minus({ 'hours': time_frame_len_hours / 2 })
    const time_frame_end = timeframe.time_frame_center.plus({ 'hours': time_frame_len_hours / 2 })
    tooltip = `<b>${time_frame_begin.toFormat('MMMdd HH:mm')} — ${time_frame_end.toFormat('MMMdd HH:mm')} (${timezone})</b> <br>
        Temperature: ${timeframe.temperature_2m.toFixed(2)} °C <br>
        <br>                
        Moon altitude: ${get_moon_alt_info_str(timeframe.moon.altitude, timeframe.moon.rising)} <br>
        Sun altitude: ${get_sun_alt_info_str(timeframe.sun.altitude, timeframe.sun.rising)} <br>
        Moon phase: ${get_moon_phase_info_str(timeframe.moon.phase_angle)} <br>
        Sky: ${get_cloudcover_info_str(timeframe.cloudcover)} <br>
        <u><b>Suitability: ${(timeframe.suit.overall * 100).toFixed()} %</u></b><br>`

    return tooltip;
}




