const cellSize = 40;
const cellPadding = cellSize/10;
const svg_padding_left = 20;
const svg_padding_right = 20;
const time_label_hor_space = 35;
const date_label_vert_space = 105;
const svg_padding_top = 20;
const svg_padding_bot = 20;

const width = (cellSize+cellPadding) * 15 + cellPadding +time_label_hor_space+ svg_padding_left + svg_padding_right
// + 120 is the height of the date sting on the bottom
const height = (cellSize+cellPadding) * 4 + cellPadding + date_label_vert_space + svg_padding_top + svg_padding_bot

function build_time_table(aggregated) {
    document.getElementById("heatmap").innerHTML = ""
    const data = []
    let i = 0
    for (let time_frame of aggregated.order_of_time_frames) {
        data.push({
            "i": i,
            "time_frame_center": new Date(aggregated[time_frame].time_frame_center),
            "time_frame_id": time_frame
        })
        i++;
    }

    // console.log(data)

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
    const transparent_cells_group = svg.append('g')
        .attr('transform', `translate(${svg_padding_left + time_label_hor_space}, ${svg_padding_top})`)
    const colorScale = d3.scaleLinear()
        .domain([0, 1]) // Set the input domain
        .range(["#d9d9d9", "#1a9641"]) // Set the output range from gray to green
        .interpolate(d3.interpolateRgb);


    // without setting the hours of the first date to zero, the date would get skipped (
    // probably because it's after 12 o'clock or so).
    const x_labels = d3.timeDays(new Date(data[0].time_frame_center).setHours(0, 0, 0, 0), new Date(data[data.length - 1].time_frame_center));
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i in x_labels) {
        x_labels[i] = {
            'i': i,
            'day': `${weekdays[x_labels[i].getDay()]} ${('0' + x_labels[i].getDate()).slice(-2)}.${('0' + (x_labels[i].getMonth() + 1)).slice(-2)}.${x_labels[i].getFullYear()}`
        }
    }

    // const y_labels = [
    //     { "i": 0, "time_frame": "02:00-05:00" },
    //     { "i": 1, "time_frame": "23:00-02:00" },
    //     { "i": 2, "time_frame": "20:00-23:00" },
    //     { "i": 3, "time_frame": "17:00-20:00" }
    // ]
    const y_labels = [
        { "i": 0, "time": "05:00" },
        { "i": 1, "time": "02:00" },
        { "i": 2, "time": "23:00" },
        { "i": 3, "time": "20:00" },
        { "i": 4, "time": "17:00" }
    ]

    const cells = cells_group.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('x', function (d) {
            const col = Math.floor(d.i / 4)
            return col * (cellSize + cellPadding);
        })
        .attr('y', function (d) {
            const hour = d.time_frame_center.getHours()
            let row;
            if (hour == 18) { row = 3 }
            if (hour == 21) { row = 2 }
            if (hour == 0) { row = 1 }
            if (hour == 3) { row = 0 }
            return (row) * (cellSize + cellPadding);
        })
        .attr('fill', function (d) {
            return d ? colorScale(aggregated[d.time_frame_id].suit.overall) : '#eee';
        })

    const transparent_cells = transparent_cells_group.selectAll('.transparent-rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('x', function (d) {
            const col = Math.floor(d.i / 4)
            return col * (cellSize + cellPadding);
        })
        .attr('y', function (d) {
            const hour = d.time_frame_center.getHours()
            let row;
            if (hour == 18) { row = 3 }
            if (hour == 21) { row = 2 }
            if (hour == 0) { row = 1 }
            if (hour == 3) { row = 0 }
            return (row) * (cellSize + cellPadding);
        })
        .attr("opacity", 0);
    // .attr("pointer-events", "none") // make the transparent rectangles ignore mouse events


    transparent_cells.on("mouseover", function (event, d) {
        d3.select(this)
            .attr("fill", "LemonChiffon")
            .attr("opacity", 0.5);
        tooltip.style("visibility", "visible")
            .html(build_tooltip(aggregated[d.time_frame_id]))
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px"); // Update the tooltip position
    }).on("mouseout", function (event, d) {
        // Hide the transparent rectangle
        d3.select(this).attr("opacity", 0);
        tooltip.style("visibility", "hidden"); // Hide the tooltip
    }).on("click", function (event, d) {
        show_detailed_info(d);
    });
    // make tooltip move with mouse
    // .on("mousemove", function (event, d) {
    //     tooltip.style("top", (event.pageY - 10) + "px")
    //         .style("left", (event.pageX + 10) + "px"); // Update the tooltip position
    // })
    // Add mouseout event listener

    // make triagles bottem right if CC is low
    // triangleGroup.selectAll('tri')
    //     .data(data)
    //     .enter()
    //     .append('polyline')
    //     // .attr('width', cellSize)
    //     // .attr('height', cellSize)
    //     .attr('points', function (d) {
    //         if (aggregated[d.time_frame_id].cloudcover < 15) {
    //             let index;
    //             for (let i in data) {
    //                 let item = data[i]
    //                 if (item.time_frame_center == d.time_frame_center) { index = i }
    //             }
    //             const col = Math.floor(index / 4)
    //             const x_cell_bot_right = col * (cellSize + cellPadding) + cellSize;

    //             const hour = d.time_frame_center.getHours()
    //             let row;
    //             if (hour == 18) { row = 3 }
    //             if (hour == 21) { row = 2 }
    //             if (hour == 0) { row = 1 }
    //             if (hour == 3) { row = 0 }
    //             const y_cell_bot_right = (row) * (cellSize + cellPadding) + cellSize;

    //             return `${x_cell_bot_right} ${y_cell_bot_right} ${x_cell_bot_right - cellSize / 5} ${y_cell_bot_right} ${x_cell_bot_right} ${y_cell_bot_right - cellSize / 5}`
    //         }
    //     })
    //     .attr('fill', 'CornflowerBlue')
    //     .attr("opacity", 1);

    

    moonIconGroup.selectAll('tri')
        .data(data)
        .enter()
        .append('text')
        .style('font-size', 'x-small')        
        .style("filter", "grayscale(100%)")  
        .attr('text-anchor', 'end')  
        .attr('transform', function (d) {
            if (aggregated[d.time_frame_id].cloudcover < 15 && aggregated[d.time_frame_id].moon.altitude > 0) {
                let index;
                for (let i in data) {
                    let item = data[i]
                    if (item.time_frame_center == d.time_frame_center) { index = i }
                }
                const col = Math.floor(index / 4)
                const x_cell_bot_right = col * (cellSize + cellPadding) + cellSize;

                const hour = d.time_frame_center.getHours()
                let row;
                if (hour == 18) { row = 3 }
                if (hour == 21) { row = 2 }
                if (hour == 0) { row = 1 }
                if (hour == 3) { row = 0 }
                const y_cell_bot_right = (row) * (cellSize + cellPadding) + cellSize;

                // -4 because the moon emoji hangs below the baseline
                return `translate(${x_cell_bot_right} ${y_cell_bot_right - 4})`
            }
        })
        .text(function (d) { if (aggregated[d.time_frame_id].cloudcover < 15 && aggregated[d.time_frame_id].moon.altitude > 0) {
            return get_moon_phase_emoji(aggregated[d.time_frame_id].moon.phase_angle)
        } })
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
        .text(function (d) { return d.day });

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
        `New Moon (${angle.toFixed()}°) \u{1f311}`, // New Moon
        `Waxing Crescent Moon (${angle.toFixed()}°) \u{1f312}`, // Waxing Crescent Moon
        `First Quarter Moon (${angle.toFixed()}°) \u{1f313}`, // First Quarter Moon
        `Waxing Gibbous Moon (${angle.toFixed()}°) \u{1f314}`, // Waxing Gibbous Moon
        `Full Moon (${angle.toFixed()}°) \u{1f315}`, // Full Moon
        `Waning Gibbous Moon (${angle.toFixed()}°) \u{1f316}`, // Waning Gibbous Moon
        `Last Quarter Moon (${angle.toFixed()}°) \u{1f317}`, // Last Quarter Moon
        `Waning Crescent Moon  (${angle.toFixed()}°) \u{1f318}`, // Waning Crescent Moon
    ];

    // Calculate the moon phase index based on the angle
    const phase_index = Math.round(angle / 45) % 8;

    // Return the corresponding moon emoji
    return strings[phase_index];
}

function get_moon_phase_emoji(angle) {
    /** Builds an informational string about the moon phase
     * from the given moon phase angle.
     * 
     * @param {number} angle The angle of the moon phase [0 to 360), 
     * 0 -> New Moon, 180 -> Full Moon.
     * 
     * @returns {String} An informational string containing a moon emoji.
     */
    const strings = [
        `\u{1f311}`, // New Moon
        `\u{1f312}`, // Waxing Crescent Moon
        `\u{1f313}`, // First Quarter Moon
        `\u{1f314}`, // Waxing Gibbous Moon
        `\u{1f315}`, // Full Moon
        `\u{1f316}`, // Waning Gibbous Moon
        `\u{1f317}`, // Last Quarter Moon
        `) \u{1f318}`, // Waning Crescent Moon
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
     * negative values indication moon poistion below horizon
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
     * negative values indication sun poistion below horizon
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

function build_tooltip(time_frame) {
    tooltip = `<b>${time_frame.time_frame_center.toLocaleString().slice(0, -3)} ± 1:30</b> <br>                
        Moon altitude: ${get_moon_alt_info_str(time_frame.moon.altitude, time_frame.moon.rising)} <br>
        Sun altitude: ${get_sun_alt_info_str(time_frame.sun.altitude, time_frame.sun.rising)} <br>
        Moon phase: ${get_moon_phase_info_str(time_frame.moon.phase_angle)} <br>
        Sky: ${get_cloudcover_info_str(time_frame.cloudcover)} <br>
        <u>Suitability: ${(time_frame.suit.overall * 100).toFixed()} %</u>`
    return tooltip;
}

function show_detailed_info(d) {
    console.log(d)
}



