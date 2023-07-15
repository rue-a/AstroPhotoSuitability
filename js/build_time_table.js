const cellSize = 40;
const cellPadding = cellSize / 10;
const svg_padding_left = 20;
const svg_padding_right = 20;
const time_label_hor_space = 35;
const date_label_vert_space = 105;
const svg_padding_top = 20;
const svg_padding_bot = 20;

const width = (cellSize + cellPadding) * 15 + cellPadding + time_label_hor_space + svg_padding_left + svg_padding_right
// + 120 is the height of the date sting on the bottom
const height = (cellSize + cellPadding) * 4 + cellPadding + date_label_vert_space + svg_padding_top + svg_padding_bot




function build_time_table(aggregated) {
    document.getElementById("heatmap").innerHTML = ""
    const data = aggregated.timeframes.map((timeframe, index) => {
        timeframe.time_frame_center = luxon.DateTime.fromISO(timeframe.time_frame_center).setZone(aggregated.timezone)
        timeframe.index = index
        return timeframe
    })


    const svg = d3.select('#heatmap')
        .append('svg')
        .attr('width', width)
        .attr('height', height);


    const cells_group = svg.append('g')
        .attr('transform', `translate(${svg_padding_left + time_label_hor_space}, ${svg_padding_top})`)
    // const triangleGroup = svg.append('g')
    //     .attr('transform', `translate(${svg_padding_left + time_label_hor_space}, ${svg_padding_top})`)
    const moonIconGroup = svg.append('g')
        .attr('transform', `translate(${svg_padding_left + time_label_hor_space}, ${svg_padding_top})`)
    const colorScale = d3.scaleLinear()
        .domain([0, 1]) // Set the input domain
        .range(["#d9d9d9", "#1a9641"]) // Set the output range from gray to green
        .interpolate(d3.interpolateRgb);


    const x_labels = [...new Set(data.map(data => {
        return data.time_frame_center.toFormat('EEE, MMM dd');
    }))].map((label, index) => {
        return { 'i': index, 'label': label }
    })


    let y_labels = []
    for (let i = 0; i < aggregated.nb_of_timeframes_per_cycle; i++) {
        y_labels.push({ 'i': aggregated.nb_of_timeframes_per_cycle - i, 'time': `${data[i].time_frame_center.minus({ 'hours': 1, 'minutes': 30 }).hour.toString().padStart(2, '0')}:00` })
    }
    y_labels.push({ 'i': 0, 'time': `${data[aggregated.nb_of_timeframes_per_cycle - 1].time_frame_center.plus({ 'hours': 1, 'minutes': 30 }).hour.toString().padStart(2, '0')}:00` })


    const cells = cells_group.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('x', function (d) {
            const col = Math.floor(d.index / 4)
            return col * (cellSize + cellPadding);
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
                .attr("fill", "LemonChiffon")
            tooltip.style("visibility", "visible")
                .html(build_tooltip(d, aggregated.time_frame_len, aggregated.timezone_abbreviation))
                .style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px"); // Update the tooltip position
        }).on("mouseout", function (event, d) {
            // Hide the transparent rectangle
            d3.select(this).attr('fill', function (d) {
                return d ? colorScale(d.suit.overall) : '#eee';
            })
            tooltip.style("visibility", "hidden"); // Hide the tooltip

        })
        .on("click", function (event, d) {
            cells_group.selectAll('rect').attr('stroke', null)
            d3.select(this)
                .attr('stroke', "tomato")

            build_sky_map(d.time_frame_center.toISO(), aggregated.latitude, aggregated.longitude, aggregated.elevation);
        })



    moonIconGroup.selectAll('tri')
        .data(data)
        .enter()
        .append('text')
        .style('font-size', 'x-small')
        // .style("filter", "grayscale(100%)")
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

                // -4 because the moon emoji hangs below the baseline
                return `translate(${x_cell_bot_right - 1} ${y_cell_bot_right - 3})`
            }
        })
        .text(function (d) {
            if (d.moon.altitude > 0) {
                return get_moon_phase_symbol(d.moon.phase_angle)
            }
        })
        .attr('font-family', 'Consolas')
        .attr("opacity", 0.5);


    // Create the tooltip element
    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "hovertip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("padding", "5px")
        .style("margin", "5px")
        .style("visibility", "hidden")
        .style("width", "auto")
        .style('font-family', 'Consolas')
        .style('font-size', 'x-small')
    // .style("white-space", "nowrap");

    svg.selectAll("y-label")
        .data(y_labels)
        .enter()
        .append('text')
        .attr('font-family', 'Consolas')
        .attr('font-size', 'small')
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'middle')
        .attr('x', svg_padding_left + time_label_hor_space - 10)
        .attr('y', function (d) {
            return d.i * (cellSize + cellPadding) + svg_padding_top;
        })
        .text(function (d) { return d.time });

    svg.selectAll("x-label")
        .data(x_labels)
        .enter()
        .append('text')
        .attr('font-family', 'Consolas')
        .attr('font-size', 'small')
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'hanging')
        .attr('transform', function (d) {
            let x = ((parseInt(d.i)) * (cellSize + cellPadding)) + svg_padding_left + time_label_hor_space - cellSize / 5;
            let y = 4 * (cellSize + cellPadding) + svg_padding_top + 10;
            return `translate(${x} ${y}) rotate(-75)`;
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

function get_moon_phase_symbol(angle) {
    /** Builds an informational string about the moon phase
     * from the given moon phase angle.
     * 
     * @param {number} angle The angle of the moon phase [0 to 360), 
     * 0 -> New Moon, 180 -> Full Moon.
     * 
     * @returns {String} An informational string containing a moon emoji.
     */
    const strings = [
        `🌑︎`, // New Moon
        `🌒︎`, // Waxing Crescent Moon
        `🌓︎`, // First Quarter Moon
        `🌔︎`, // Waxing Gibbous Moon
        `🌕︎`, // Full Moon
        `🌖︎`, // Waning Gibbous Moon
        `🌗︎`, // Last Quarter Moon
        `🌘︎`, // Waning Crescent Moon
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




