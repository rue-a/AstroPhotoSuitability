function get_az_and_alt_of_astro_body(body, date, observer) {
    /** Uses the Astronomy lib to calculate the azimuth and altitude
     * of a given astronomical body form a certain observer location
     * and point in time.
     * 
     * @param {Astronomy.Body} body an astronomical body available in the Astronomy lib
     * @param {Date} date a JS Date object
     * @param {Astronomy.Observer} observer the position of a observer 
     * 
     * @returns {object} {'azimuth': azimuth, 'altitude': altitude}
     */

    const eqd = Astronomy.Equator(body, date, observer, true, false);
    const hor = Astronomy.Horizon(date, observer, eqd.ra, eqd.dec, 'normal');
    return { 'azimuth': hor.azimuth, 'altitude': hor.altitude }
}

function build_sky_map(datetime, lat, lon, alt) {
    /** Uses d3 to build a skymap in a div with the id "skymap".
     * 
     * @param {string} datetime current date as ISO string
     * @param {number} lat latitude of observer
     * @param {number} lon longitude of observer
     * @param {number} alt altitude of observer
     */

    document.getElementById("skymap").innerHTML = ""

    const astro_data = [];
    const interval = 20;
    const duration = 8;
    const startTime = luxon.DateTime.fromISO(datetime).minus({ hours: duration });

    for (let i = 0; i <= duration * 60 / interval; i++) {
        const timestamp = startTime.plus({ 'minutes': interval * i }).toISO();
        astro_data.push({ 'time': timestamp });
    }

    const observer = new Astronomy.Observer(lat, lon, alt);
    astro_data.forEach(entry => {
        entry.sun = get_az_and_alt_of_astro_body(Astronomy.Body.Sun, new Date(entry.time), observer)
        entry.sun.label = "Sun"
        entry.moon = get_az_and_alt_of_astro_body(Astronomy.Body.Moon, new Date(entry.time), observer)
        entry.moon.phase_angle = Astronomy.MoonPhase(new Date(entry.time));
        entry.moon.label = "Moon"

        entry.mercury = get_az_and_alt_of_astro_body(Astronomy.Body.Mercury, new Date(entry.time), observer)
        entry.mercury.label = "Mercury"
        entry.venus = get_az_and_alt_of_astro_body(Astronomy.Body.Venus, new Date(entry.time), observer)
        entry.venus.label = "Venus"
        entry.mars = get_az_and_alt_of_astro_body(Astronomy.Body.Mars, new Date(entry.time), observer)
        entry.mars.label = "Mars"
        entry.jupiter = get_az_and_alt_of_astro_body(Astronomy.Body.Jupiter, new Date(entry.time), observer)
        entry.jupiter.label = "Jupiter"
        entry.saturn = get_az_and_alt_of_astro_body(Astronomy.Body.Saturn, new Date(entry.time), observer)
        entry.saturn.label = "Saturn"
        entry.uranus = get_az_and_alt_of_astro_body(Astronomy.Body.Uranus, new Date(entry.time), observer)
        entry.uranus.label = "Uranus"
        entry.neptune = get_az_and_alt_of_astro_body(Astronomy.Body.Neptune, new Date(entry.time), observer)
        entry.neptune.label = "Neptune"

        entry.sun.symbol = '☉'
        const moon_symbols = ['🌑︎', '🌒︎', '🌓︎', '🌔︎', '🌕︎', '🌖︎', '🌗︎', '🌘︎'];
        entry.moon.symbol = moon_symbols[Math.round(entry.moon.phase_angle / 45) % 8]

        entry.mercury.symbol = '☿'
        entry.venus.symbol = '♀'
        entry.mars.symbol = '♂'
        entry.jupiter.symbol = '♃'
        entry.saturn.symbol = '♄'
        entry.uranus.symbol = '♅'
        entry.neptune.symbol = '♆'

        Astronomy.DefineStar(Astronomy.Body.Star1, 5.52, -5.40, 1344)
        Astronomy.DefineStar(Astronomy.Body.Star2, 0.68, 41.27, 2537000)
        Astronomy.DefineStar(Astronomy.Body.Star3, 3.79, 24.07, 444)
        Astronomy.DefineStar(Astronomy.Body.Star4, 16.68, 36.70, 22200)
        Astronomy.DefineStar(Astronomy.Body.Star5, 18.18, -13.80, 7000)
        Astronomy.DefineStar(Astronomy.Body.Star6, 18.64, 33.03, 2300)
        Astronomy.DefineStar(Astronomy.Body.Star7, 18.16, -24.23, 4100)
        Astronomy.DefineStar(Astronomy.Body.Star8, 13.44, 47.18, 23000000)

        entry.M42 = get_az_and_alt_of_astro_body(Astronomy.Body.Star1, new Date(entry.time), observer);
        entry.M42.label = "Orion Nebula";
        entry.M42.symbol = "M42";
        entry.M31 = get_az_and_alt_of_astro_body(Astronomy.Body.Star2, new Date(entry.time), observer);
        entry.M31.label = "Andromeda Galaxy";
        entry.M31.symbol = "M31";
        entry.M45 = get_az_and_alt_of_astro_body(Astronomy.Body.Star3, new Date(entry.time), observer);
        entry.M45.label = "Pleiades Star Cluster";
        entry.M45.symbol = "M45";
        entry.M13 = get_az_and_alt_of_astro_body(Astronomy.Body.Star4, new Date(entry.time), observer);
        entry.M13.label = "Hercules Cluster";
        entry.M13.symbol = "M13";
        entry.M16 = get_az_and_alt_of_astro_body(Astronomy.Body.Star5, new Date(entry.time), observer);
        entry.M16.label = "Eagle Nebula";
        entry.M16.symbol = "M16";
        entry.M57 = get_az_and_alt_of_astro_body(Astronomy.Body.Star6, new Date(entry.time), observer);
        entry.M57.label = "Ring Nebula";
        entry.M57.symbol = "M57";
        entry.M8 = get_az_and_alt_of_astro_body(Astronomy.Body.Star7, new Date(entry.time), observer);
        entry.M8.label = "Lagoon Nebula";
        entry.M8.symbol = "M8";
        entry.M51 = get_az_and_alt_of_astro_body(Astronomy.Body.Star8, new Date(entry.time), observer);
        entry.M51.label = "Whirlpool Galaxy";
        entry.M51.symbol = "M51";

        entry.sun.color = "#F7DC6F"
        entry.moon.color = "#99A3A4"
        entry.mercury.color = "#D98880"
        entry.venus.color = "#AF7AC5"
        entry.mars.color = "#EC7063"
        entry.jupiter.color = "#E59866"
        entry.saturn.color = "#F8C471"
        entry.uranus.color = "#5DADE2"
        entry.neptune.color = "#48C9B0"
        entry.M42.color = "#85929E"
        entry.M31.color = "#85929E"
        entry.M45.color = "#85929E"
        entry.M13.color = "#85929E"
        entry.M16.color = "#85929E"
        entry.M57.color = "#85929E"
        entry.M8.color = "#85929E"
        entry.M51.color = "#85929E"


    })

    const astro_data_centers = Object.values(astro_data[Math.floor(astro_data.length / 2)]).slice(1,)
    console.log(astro_data_centers)
    const astro_data_past = astro_data.slice(0, 1 + Math.floor(astro_data.length / 2))
    const astro_data_future = astro_data.slice(Math.floor(astro_data.length / 2),)



    const width = 800; // Width of the SVG container
    const height = 800; // Height of the SVG container
    const centerX = width / 2; // X-coordinate of the center
    const centerY = height / 2; // Y-coordinate of the center

    // Create an SVG container
    const svg = d3.select("#skymap")
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Define the range for radius (r) and angle (phi)
    const radiusScale = d3.scaleLinear()
        .domain([-90, 90]) // Range for r
        // scaling with 1.8 as factor "zooms in"; we're not interested what happens at daytime
        .range([0, Math.min(width * 1.8, height * 1.8) / 2]); // Output range for radius

    const angleScale = d3.scaleLinear()
        .domain([0, 360]) // Range for phi
        .range([+Math.PI / 2, -3 / 2 * Math.PI]); // Output range for angle

    // Create a group element to hold the circular graph elements
    const graph = svg.append("g")
        .attr("transform", `translate(${centerX}, ${centerY})`); // Position the graph at the center of the SVG

    // draw night/day circle
    graph.append("circle")
        .attr("cx", radiusScale(-90))
        .attr("cy", radiusScale(-90))
        .attr("r", radiusScale(0)) // Set the radius of each point
        .style("fill", "#2C3E50")
        .style("stroke", "none");

    // draw -45 degree circle
    graph.selectAll('circle')
        .data([-90, -75, -60, -45, -30, -15, 0])
        .enter()
        .append("circle")
        .attr("cx", radiusScale(-90))
        .attr("cy", radiusScale(-90))
        .attr("r", (d) => radiusScale(d)) // Set the radius of each point
        .style("fill", "none")
        .style("stroke", "#566573");

    graph.selectAll("line")
        .data([0, 45, 90, 135, 180, 225, 270, 315]) // Specify the radius values
        .enter()
        .append("line")
        .attr("x1", 0) // Starting point at the center
        .attr("y1", 0) // Starting point at the center
        .attr("x2", (d) => radiusScale(0) * Math.cos(angleScale(d))) // Ending point at the circumference using r and phi
        .attr("y2", (d) => radiusScale(0) * Math.sin(angleScale(d))) // Ending point at the circumference using r and phi
        .style("stroke", "#566573"); // Set the line color


    object_ids = Object.keys(astro_data[0]).filter((item) => item !== 'time');
    object_ids.forEach((id) => {
        let line = d3.line()
            .x((d) => radiusScale(d[id].altitude) * Math.cos(angleScale(d[id].azimuth))) // Calculate the x-coordinate using r and phi
            .y((d) => radiusScale(d[id].altitude) * Math.sin(angleScale(d[id].azimuth))); // Calculate the y-coordinate using r and phi
        graph.append("path")
            .datum(astro_data_past)
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", (d) => d[0][id].color)
            .attr("stroke-width", 2)
            .attr('opacity', 0.3)
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .attr("opacity", 1)
                    .attr("stroke-width", 3)
                // tooltip.style("visibility", "visible")
                //     .html(build_tooltip(d, aggregated.time_frame_len, aggregated.timezone_abbreviation))
                //     .style("top", (event.pageY - 10) + "px")
                //     .style("left", (event.pageX + 10) + "px"); // Update the tooltip position
            }).on("mouseout", function (event, d) {
                // Hide the transparent rectangle
                d3.select(this)
                    .attr('opacity', 0.3)
                    .attr("stroke-width", 2)
                // tooltip.style("visibility", "hidden"); // Hide the tooltip

            })
        graph.append("path")
            .datum(astro_data_future)
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", (d) => d[0][id].color)
            .attr("stroke-width", 2)
            .style("stroke-dasharray", ("3, 3"))
            .attr('opacity', 0.3)
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .attr("opacity", 1)
                    .attr("stroke-width", 3)
                // tooltip.style("visibility", "visible")
                //     .html(build_tooltip(d, aggregated.time_frame_len, aggregated.timezone_abbreviation))
                //     .style("top", (event.pageY - 10) + "px")
                //     .style("left", (event.pageX + 10) + "px"); // Update the tooltip position
            }).on("mouseout", function (event, d) {
                // Hide the transparent rectangle
                d3.select(this)
                    .attr('opacity', 0.3)
                    .attr("stroke-width", 2)
                // tooltip.style("visibility", "hidden"); // Hide the tooltip

            })

    });
    graph.selectAll('circle-')
        .data(astro_data_centers)
        .enter()
        .append('circle')
        .attr("cx", 0)
        .attr("cy", 0)
        .attr('transform', (d) => {
            console.log(d)
            const x = radiusScale(d.altitude) * Math.cos(angleScale(d.azimuth))
            const y = radiusScale(d.altitude) * Math.sin(angleScale(d.azimuth))
            return `translate(${x} ${y})`
        })
        .attr('r', 3)
        .style('fill', (d) => d.color)
    graph.selectAll('text')
        .data(astro_data_centers)
        .enter()
        .append('text')
        .style('font-size', 'normal')
        .attr('text-anchor', 'end')
        .attr('transform', (d) => {
            const x = radiusScale(d.altitude) * Math.cos(angleScale(d.azimuth))
            const y = radiusScale(d.altitude) * Math.sin(angleScale(d.azimuth))
            return `translate(${x + 6} ${y + 3})`
        })
        .text((d) => d.symbol)
        .attr('text-anchor', 'start')
        .attr('alignment-baseline', 'middle')
        .attr('font-family', 'Consolas')
        .style('fill', (d) => d.color)


    // draw mask
    var arc = d3.arc()
        .innerRadius(radiusScale(8))
        .outerRadius(radiusScale(90))
        .startAngle(100)
        .endAngle(2 * 180);

    graph.append("path")
        .attr("class", "arc")
        .attr("d", arc)
        .attr("fill", "white");



    console.log(astro_data)
}