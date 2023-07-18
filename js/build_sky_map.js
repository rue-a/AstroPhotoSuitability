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

function set_up_skymap(skymap_id) {
    const skymap_container = document.getElementById(skymap_id);
    skymap_container.innerHTML = '';

    const skymap_element = window.getComputedStyle(skymap_container);
    const width = parseInt(skymap_element.getPropertyValue('width'));
    const height = parseInt(skymap_element.getPropertyValue('height'));

    const radiusScale = d3.scaleLinear()
        .domain([90, -90])
        .range([0, Math.min(width * 1.5, height * 1.5) / 2]);

    const angleScale = d3.scaleLinear()
        .domain([0, 360])
        .range([-Math.PI / 2, 3 / 2 * Math.PI]);

    const svg = d3.select(`#${skymap_id}`)
        .append('svg')
        .attr('class', 'skymap')
        .attr('width', '100%')
        .attr('height', '100%');

    const graph = svg.append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);



    graph.append('circle')
        .attr('class', 'sky-circle')
        .attr('cx', radiusScale(90))
        .attr('cy', radiusScale(90))
        .attr('r', radiusScale(-18));



    graph.selectAll('.outer-circle')
        .data([-6, -12, -18])
        .enter()
        .append('circle')
        .attr('class', 'outer-orientation-circle')
        .attr('cx', radiusScale(90))
        .attr('cy', radiusScale(90))
        .attr('r', (d) => radiusScale(d))

    graph.selectAll('.inner-circle')
        .data([90, 60, 30, 0])
        .enter()
        .append('circle')
        .attr('class', 'inner-orientation-circle')
        .attr('cx', radiusScale(90))
        .attr('cy', radiusScale(90))
        .attr('r', (d) => radiusScale(d));

    graph.selectAll('.altitude-lines')
        .data([0, 90, 180, 270])
        .enter()
        .append('line')
        .attr('class', 'orientation-line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', (d) => radiusScale(-18) * Math.cos(angleScale(d)))
        .attr('y2', (d) => radiusScale(-18) * Math.sin(angleScale(d)));

    graph.selectAll('direction')
        .data([['N', 0], ['E', 90], ['S', 180], ['W', 270]])
        .enter()
        .append('text')
        .attr('class', 'direction-label text')
        .attr('transform', (d) => {
            const x = radiusScale(-21.5) * Math.cos(angleScale(d[1]))
            const y = radiusScale(-21.5) * Math.sin(angleScale(d[1]))
            return `translate(${x} ${y + 1.5})`
        })
        .text((d) => d[0]);

    graph.selectAll('line-label')
        .data([90, 60, 30, 0, -6, -12, -18])
        .enter()
        .append('text')
        .attr('class', 'line-label text')
        .attr('transform', (d) => {
            const x = radiusScale(d) * Math.cos(angleScale(0))
            const y = radiusScale(d) * Math.sin(angleScale(0))
            return `translate(${x + 3} ${y + 12})`
        })
        .text((d) => String(d).padStart(3, ' '));

    return [graph, radiusScale, angleScale];
}


function build_skymap(datetime, lat, lon, alt, timezone) {
    /** Uses d3 to build a skymap in a div with the id "skymap".
     * 
     * @param {string} datetime current date as ISO string
     * @param {number} lat latitude of observer
     * @param {number} lon longitude of observer
     * @param {number} alt altitude of observer
     */

    const astro_data = [];
    const timestamps = [];
    const interval = 10;
    const duration = 24;
    const startTime = luxon.DateTime.fromISO(datetime).minus({ hours: duration / 2 });

    for (let i = 0; i <= duration * 60 / interval; i++) {
        const timestamp = startTime.plus({ 'minutes': interval * i }).toISO();
        timestamps.push(timestamp);
    }

    Astronomy.DefineStar(Astronomy.Body.Star1, 5.52, -5.40, 1344)
    Astronomy.DefineStar(Astronomy.Body.Star2, 0.68, 41.27, 2537000)
    Astronomy.DefineStar(Astronomy.Body.Star3, 3.79, 24.07, 444)
    Astronomy.DefineStar(Astronomy.Body.Star4, 16.68, 36.70, 22200)
    Astronomy.DefineStar(Astronomy.Body.Star5, 18.18, -13.80, 7000)
    Astronomy.DefineStar(Astronomy.Body.Star6, 18.64, 33.03, 2300)
    Astronomy.DefineStar(Astronomy.Body.Star7, 18.16, -24.23, 4100)
    Astronomy.DefineStar(Astronomy.Body.Star8, 13.44, 47.18, 23000000)
    const observer = new Astronomy.Observer(lat, lon, alt);

    timestamps.forEach(timestamp => {
        astro_data.push([
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Sun, new Date(timestamp), observer),
                symbol: "☉",
                id: "sun"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Moon, new Date(timestamp), observer),
                label: "Moon",
                symbol: ['🌑︎', '🌒︎', '🌓︎', '🌔︎', '🌕︎', '🌖︎', '🌗︎', '🌘︎'][Math.round(Astronomy.MoonPhase(new Date(timestamp)) / 45) % 8],
                id: "moon"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Mercury, new Date(timestamp), observer),
                label: "Mercury",
                symbol: "☿",
                id: "mercury"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Venus, new Date(timestamp), observer),
                label: "Venus",
                symbol: "♀",
                id: "venus"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Mars, new Date(timestamp), observer),
                label: "Mars",
                symbol: "♂",
                id: "mars"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Jupiter, new Date(timestamp), observer),
                label: "Jupiter",
                symbol: "♃",
                id: "jupiter"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Saturn, new Date(timestamp), observer),
                label: "Saturn",
                symbol: "♄",
                id: "saturn"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Uranus, new Date(timestamp), observer),
                label: "Uranus",
                symbol: "♅",
                id: "uranus"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Neptune, new Date(timestamp), observer),
                label: "Neptune",
                symbol: "♆",
                id: "neptune"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Star1, new Date(timestamp), observer),
                label: "Orion Nebula",
                symbol: "M42",
                id: "m42"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Star2, new Date(timestamp), observer),
                label: "Andromeda Galaxy",
                symbol: "M31",
                id: "m31"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Star3, new Date(timestamp), observer),
                label: "Pleiades Star Cluster",
                symbol: "M45",
                id: "m45"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Star4, new Date(timestamp), observer),
                label: "Hercules Cluster",
                symbol: "M13",
                id: "m13"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Star5, new Date(timestamp), observer),
                label: "Eagle Nebula",
                symbol: "M16",
                id: "m16"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Star6, new Date(timestamp), observer),
                label: "Ring Nebula",
                symbol: "M57",
                id: "m57"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Star7, new Date(timestamp), observer),
                label: "Lagoon Nebula",
                symbol: "M8",
                id: "m8"
            },
            {
                position: get_az_and_alt_of_astro_body(Astronomy.Body.Star8, new Date(timestamp), observer),
                label: "Whirlpool Galaxy",
                symbol: "M51",
                id: "m51"
            }
        ]);
    });


    const [graph, radiusScale, angleScale] = set_up_skymap("skymap")



    // Create the tooltip element
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "hovertip text")

    function build_astro_obj_tooltip(data) {
        return `<b>${data.label} (${data.symbol})</b><br>
            Azimuth: ${data.position.azimuth.toFixed(2)}<br>
            Altitude: ${data.position.altitude.toFixed(2)}`
    }


    const slider_container = d3.select('#skymap')
        .append('div')
        .attr('class', "row justify-content-center")
    // Append the label
    const sliderLabel = slider_container.append("div")
        .attr("class", "slider-label")
        .attr("id", "sliderLabel");



    // const sliderContainer = d3.select("#slider");
    const slider = slider_container.append("input")
        .attr("type", "range")
        .attr('class', 'slider text')
        .attr("min", 0)
        .attr("max", astro_data.length - 1)
        .attr("step", 1)
        .attr("value", 0);
    // Set initial label text



    slider.node().value = Math.floor(astro_data.length / 2)

    slider.on("input", function () {
        // Get the selected time value
        const selectedTime = +this.value;
        const astro_objects = astro_data[selectedTime]
        sliderLabel.text(
            `${luxon.DateTime.fromISO(timestamps[selectedTime]).setZone(timezone).toFormat('yyyy-MM-dd HH:mm:ss ZZZZ')} 
            (${lat >= 0 ? lat.toFixed(2) + "°N" : (-lat).toFixed(2) + "°S"}, ${lon >= 0 ? lon.toFixed(2) + "°E" : -lon.toFixed(2) + "°W"})`
        );

        // Update the visualization based on the selected time
        const circles = graph.selectAll('.astro-object-position')
            .data(astro_objects);

        // Update existing circles
        circles
            .attr("cx", 0)
            .attr("cy", 0)
            .attr('transform', (d) => {
                const x = radiusScale(d.position.altitude) * Math.cos(angleScale(d.position.azimuth));
                const y = radiusScale(d.position.altitude) * Math.sin(angleScale(d.position.azimuth));
                return `translate(${x} ${y})`;
            })
            .attr('id', (d) => d.id);

        // Enter new circles
        circles.enter()
            .append('circle')
            .attr('class', 'astro-object-position')
            .attr("cx", 0)
            .attr("cy", 0)
            .attr('transform', (d) => {
                const x = radiusScale(d.position.altitude) * Math.cos(angleScale(d.position.azimuth));
                const y = radiusScale(d.position.altitude) * Math.sin(angleScale(d.position.azimuth));
                return `translate(${x} ${y})`;
            })
            .attr('id', (d) => d.id)
            .on("mouseover", function (event, d) {
                d3.select(this)
                tooltip.style("visibility", "visible")
                    .html(build_astro_obj_tooltip(d))
                    .style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function () {
                d3.select(this)
                tooltip.style("visibility", "hidden");
            });

        // Remove circles that are no longer needed
        circles.exit().remove();

        // Update or add text elements
        const labels = graph.selectAll('.astro-object-label')
            .data(astro_objects);

        // Update existing text elements
        labels
            .attr('transform', (d) => {
                const x = radiusScale(d.position.altitude) * Math.cos(angleScale(d.position.azimuth))
                const y = radiusScale(d.position.altitude) * Math.sin(angleScale(d.position.azimuth))
                return `translate(${x + 6} ${y + 3})`
            })
            .attr('id', (d) => d.id);

        // Enter new text elements
        labels.enter()
            .append('text')
            .attr('class', 'astro-object-label text')
            .attr('id', (d) => d.id)
            .on("mouseover", function (event, d) {
                d3.select(this)
                tooltip.style("visibility", "visible")
                    .html(build_astro_obj_tooltip(d))
                    .style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px"); // Update the tooltip position
            })
            .on("mouseout", function () {
                d3.select(this)
                tooltip.style("visibility", "hidden"); // Hide the tooltip
            })
            .attr('transform', (d) => {
                const x = radiusScale(d.position.altitude) * Math.cos(angleScale(d.position.azimuth))
                const y = radiusScale(d.position.altitude) * Math.sin(angleScale(d.position.azimuth))
                return `translate(${x + 6} ${y + 3})`
            })
            .text((d) => d.symbol);

        // Remove text elements that are no longer needed
        labels.exit().remove();

        // make sky animation
        d3.selectAll('.sky-circle')
            .style('fill', d => d3.scalePow()
                .exponent(0.5)
                .domain([0, -18])
                .range(["#F8F8F9", "#2B3644"])
                .clamp(true)(astro_objects[0].position.altitude)
            );
        d3.selectAll('.dusk-dawn-circle')
            .style('fill', d => d3.scalePow()
                .exponent(0.5)
                .domain([18, 0])
                .range(["#2B3644", "#F8F8F9"])
                .clamp(true)(astro_objects[0].position.altitude)
            );


        let mask = graph.select(".arc"); // Check if mask already exists
        if (mask.empty()) {
            // Draw mask
            const arc = d3.arc()
                .innerRadius(radiusScale(-24))
                .outerRadius(radiusScale(-90))
                .startAngle(0)
                .endAngle(360);

            mask = graph.append("path")
                .attr("class", "arc")
                .attr("d", arc)
                .attr("fill", "white");
        }




    });
    slider.dispatch("input");







}