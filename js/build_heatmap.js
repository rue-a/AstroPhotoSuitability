function build_heatmap(aggregated) {
    heatmap_container = document.getElementById("heatmap")
    heatmap_container.innerHTML = '';

    const heatmap_element = window.getComputedStyle(heatmap_container);
    const width = parseInt(heatmap_element.getPropertyValue('width'));
    const cell_width = ((9.5 / 10) * width) / 15;
    const cell_padding = ((0.5 / 10) * width) / 17;
    const cell_height = (2 / 3) * cell_width

    const label_height = 11
    const height = (cell_height + cell_padding) * aggregated.nb_of_timeframes_per_cycle




    const data = aggregated.timeframes.map((timeframe, index) => {
        timeframe.time_frame_center = luxon.DateTime.fromISO(timeframe.time_frame_center).setZone(aggregated.timezone)
        timeframe.index = index
        return timeframe
    })


    const svg = d3.select('#heatmap')
        .append('svg')
        .attr('width', width + 2 * label_height)
        .attr('height', height + 2 * label_height)
    // .attr('transform', 'translate(0 -50)')


    // translate table cell downwards to make space for label on top of table
    const cells_group = svg.append('g')
        .attr('transform', `translate(${label_height + cell_padding}, ${label_height + cell_padding})`)
    const moonIconGroup = svg.append('g')
        .attr('transform', `translate(${label_height + cell_padding}, ${label_height + cell_padding})`)
    const time_label_group = svg.append('g')
        .attr('transform', `translate(${label_height + cell_padding}, ${label_height + cell_padding})`)

    const colorScale = d3.scaleLinear()
        .domain([0, 1])
        .range(["#d9d9d9", "#1a9641"])
        .interpolate(d3.interpolateRgb);


    const x_labels = [...new Set(data.map(data => {
        return data.time_frame_center.toFormat('MMM dd');
    }))].map((label, index) => {
        return { 'i': index, 'label': label }
    })

    const y_labels = data.slice(0, aggregated.nb_of_timeframes_per_cycle).map((data, index) => {
        return { 'i': Math.abs(index - aggregated.nb_of_timeframes_per_cycle + 1), 'label': data.time_frame_center.toFormat("HH:mm") }
    })




    cells_group.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('width', cell_width)
        .attr('height', cell_height)
        .attr('x', function (d) {
            const col = Math.floor(d.index / aggregated.nb_of_timeframes_per_cycle)
            return col * (cell_width + cell_padding) + cell_padding;
        })
        .attr('y', function (d) {
            // get row_nb from offset, timeframe len and timeframe_nb (top row = 0th row)
            const row = Math.abs((d.time_frame_center.hour - Math.floor(aggregated.time_frame_len / 2) - aggregated.offset + 24) % 24 / aggregated.time_frame_len - aggregated.nb_of_timeframes_per_cycle + 1)
            return (row) * (cell_height + cell_padding);
        })
        .attr('fill', function (d) {
            return d ? colorScale(d.suit.overall) : '#eee';
        })
        .on("mouseover", function (event, d) {
            d3.select(this)
                .attr("fill", d3.interpolateRgb(this.getAttribute('fill'), "#ffffff")(0.6))
            tooltip.style("visibility", "visible")
                .html(build_tooltip(d, aggregated.time_frame_len, aggregated.timezone_abbreviation))
                .style("top", (event.pageY - tooltip.node().getBoundingClientRect().height - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        }).on("mouseout", function () {
            d3.select(this).attr('fill', function (d) {
                return d ? colorScale(d.suit.overall) : '#eee';
            })
            tooltip.style("visibility", "hidden");

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
        .attr('font-family', 'monospace')
        .attr("opacity", 0.5)
        .attr('transform', function (d) {
            if (d.moon.altitude > 0) {
                let index;
                for (let i in data) {
                    let item = data[i]
                    if (item.time_frame_center == d.time_frame_center) { index = i }
                }
                const col = Math.floor(index / aggregated.nb_of_timeframes_per_cycle)
                const x_cell_bot_right = (col + 1) * (cell_width + cell_padding);

                const row = Math.abs((d.time_frame_center.hour - Math.floor(aggregated.time_frame_len / 2) - aggregated.offset + 24) % 24 / aggregated.time_frame_len - aggregated.nb_of_timeframes_per_cycle + 1)
                const y_cell_bot_right = (row) * (cell_height + cell_padding) + cell_height;

                // move moon icon away from border
                return `translate(${x_cell_bot_right - 1.5} ${y_cell_bot_right - 2.5})`
            }
        })
        .text(function (d) {
            if (d.moon.altitude > 0) {
                return ['🌑︎', '🌒︎', '🌓︎', '🌔︎', '🌕︎', '🌖︎', '🌗︎', '🌘︎'][Math.round(d.moon.phase_angle / 45) % 8]
            }
        });


    // Create the tooltip element
    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "hovertip text")


    time_label_group.selectAll("x-labels-top")
        .data(x_labels.slice(1, x_labels.length))
        .enter()
        .append('text')
        .attr('font-family', 'monospace')
        .attr('font-size', 'x-small')
        .attr('text-anchor', 'end')
        .attr('transform', function (d) {
            // i starts with 1
            let x = parseInt(d.i) * (cell_width + cell_padding);
            let y = - cell_padding;
            return `translate(${x} ${y})`;
        })
        .text(function (d) { return d.label });

    time_label_group.selectAll("x-labels-bot")
        .data(x_labels.slice(0, x_labels.length - 1))
        .enter()
        .append('text')
        .attr('font-family', 'monospace')
        .attr('font-size', 'x-small')
        .attr('text-anchor', 'begin')
        .attr('alignment-baseline', 'hanging')
        .attr('transform', function (d) {
            // i starts with 0
            let x = parseInt(d.i) * (cell_width + cell_padding);
            let y = aggregated.nb_of_timeframes_per_cycle * (cell_height + cell_padding);
            return `translate(${x} ${y})`;
        })
        .text(function (d) { return d.label });

    time_label_group.selectAll("y-labels-left")
        .data(y_labels)
        .enter()
        .append('text')
        .attr('font-family', 'monospace')
        .attr('font-size', 'xx-small')
        .attr('text-anchor', 'middle')
        .attr('transform', function (d) {
            console.log(d)
            let x = 0;
            let y = parseInt(d.i) * (cell_height + cell_padding) + cell_height / 2;
            return `translate(${x} ${y}) rotate(270)`;
        })
        .text(function (d) { return d.label });
    time_label_group.selectAll("y-labels-right")
        .data(y_labels)
        .enter()
        .append('text')
        .attr('font-family', 'monospace')
        .attr('font-size', 'xx-small')
        .attr('text-anchor', 'middle')
        .attr('transform', function (d) {
            let x = (x_labels.length - 1) * (cell_width + cell_padding) + cell_padding;
            let y = parseInt(d.i) * (cell_height + cell_padding) + cell_height / 2;
            return `translate(${x} ${y}) rotate(90)`;
        })
        .text(function (d) { return d.label });



    return 15 * cell_width + 14 + cell_padding
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




