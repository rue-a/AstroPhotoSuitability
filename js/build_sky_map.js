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

    const astro_data = [];
    const interval = 5;
    const startTime = luxon.DateTime.fromISO(datetime).minus({ hours: 6 });

    for (let i = 0; i <= 12 * 60 / interval; i++) {
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
        entry.mercury, label = "Mercury"
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
        const moon_symbols = [`🌑︎`, `🌒︎`, `🌓︎`, `🌔︎`, `🌕︎`, `🌖︎`, `🌗︎`, `🌘︎`];
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



    })



    console.log(astro_data);
}