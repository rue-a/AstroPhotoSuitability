function aggregate_open_meteo(data, time_frame_len, time_frame_nb, offset) {


    const aggregated = {};
    aggregated.timezone = data.timezone
    aggregated.timezone_abbreviation = data.timezone_abbreviation
    aggregated.latitude = data.latitude
    aggregated.longitude = data.longitude
    aggregated.elevation = data.elevation
    aggregated.units = data.hourly_units
    aggregated.time_frame_len = time_frame_len
    aggregated.nb_of_timeframes_per_cycle = time_frame_nb
    aggregated.offset = offset
    aggregated.timeframes = []
    delete aggregated.units.time
    for (let hour = 0; hour < data.hourly.time.length; hour++) {
        if (hour == offset) {
            for (i = 0; i < time_frame_nb; i++) {
                const time = luxon.DateTime.fromMillis(data.hourly.time.slice((hour + time_frame_len * i), (hour + time_frame_len * i) + time_frame_len).map(time_str => {
                    return luxon.DateTime.fromISO(time_str, { 'zone': data.timezone }).plus({ 'minutes': 30 })
                }).reduce((sum, date) => sum + date.toMillis(), 0) / time_frame_len).toISO()
                const temperature = data.hourly.temperature_2m.slice((hour + time_frame_len * i), (hour + time_frame_len * i) + time_frame_len).reduce((sum, val) => sum + val, 0) / time_frame_len
                const cloudcover = data.hourly.cloudcover.slice((hour + time_frame_len * i), (hour + time_frame_len * i) + time_frame_len).reduce((sum, val) => sum + val, 0) / time_frame_len
                aggregated.timeframes.push({
                    'time_frame_center': time,
                    'temperatur_2m': temperature,
                    'cloudcover': cloudcover
                })

            }
            offset = offset + 24
        }

    }
    if (offset + time_frame_len * time_frame_nb > 23) {
        aggregated.timeframes = aggregated.timeframes.slice(0, aggregated.timeframes.length - time_frame_nb)
    }
    return aggregated
}


function astro_enrich_time_frame(time_frame, observer) {
    /** Enriches a time frame object that contains a time_frame_center
     * with astronomical data, depending on the observer position. 
     */
    const date = new Date(time_frame.time_frame_center);
    const dDate = (new Date(date))
    dDate.setMinutes(date.getMinutes() + 1)



    let sun_eqd = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, false);
    let sun_hor = Astronomy.Horizon(date, observer, sun_eqd.ra, sun_eqd.dec, 'normal');
    time_frame.sun = {};
    time_frame.sun.azimuth = sun_hor.azimuth;
    time_frame.sun.altitude = sun_hor.altitude;
    sun_eqd = Astronomy.Equator(Astronomy.Body.Sun, dDate, observer, true, false);
    sun_hor = Astronomy.Horizon(dDate, observer, sun_eqd.ra, sun_eqd.dec, 'normal');
    if (sun_hor.altitude > time_frame.sun.altitude) { time_frame.sun.rising = true }
    else { time_frame.sun.rising = false }

    let moon_eqd = Astronomy.Equator(Astronomy.Body.Moon, date, observer, true, false);
    let moon_hor = Astronomy.Horizon(date, observer, moon_eqd.ra, moon_eqd.dec, 'normal');
    time_frame.moon = {};
    time_frame.moon.azimuth = moon_hor.azimuth;
    time_frame.moon.altitude = moon_hor.altitude;
    moon_eqd = Astronomy.Equator(Astronomy.Body.Moon, dDate, observer, true, false);
    moon_hor = Astronomy.Horizon(dDate, observer, moon_eqd.ra, moon_eqd.dec, 'normal');
    if (moon_hor.altitude > time_frame.moon.altitude) { time_frame.moon.rising = true }
    else { time_frame.moon.rising = false }

    /* The phase angle increases from 0 degrees to 360 degrees over the span of each synodic 
    month. Certain values of the phase angle define the four lunar quarters:
        0° = New Moon
        90° = First Quarter
        180° = Full Moon
        270° = Third Quarter */
    time_frame.moon.phase_angle = Astronomy.MoonPhase(date);
    return time_frame
}


function calc_sun_altitude_suit(sun_altitude) {
    /** calculates suitability of astro-photography in regard to the sun's altitude.
     * The sun's azimut is given given as angle (-180--+180), where negative degrees
     * indicate that the sun's position is below the horizon.
     * 
     * Civil twilight: sun is 0 to 6 degree below horizon.
     * Nautical twilight: sun is 6 to 12 degree below horizon.
     * Astronomical twilight: sun is 12 to 18 degree below horizon.
     * Night: sun is > 18 degree below horizon.
     * 
     * @param {number} sun_altitude Value in the interval (-180, 180].
     * 
     * @returns {number} value between 0 and 1 where 0 means not suitable and 1
     * means very suitable.
     */

    if (sun_altitude > 0) { return 0 }
    if (sun_altitude < -18) { return 1 }

    return (1 / 324) * Math.pow(sun_altitude, 2)
}

function calc_moon_phase_suit(moon_phase) {
    /** calculates suitability of atro-photography in regard to the moon phase.
     * The moon phase is given as an angle (0--360), where 0 degree represents New Moon and 
     * 180 degree Full Moon.
     * 
     * @param {number} moon_phase Value in the intervall [0, 360).
     * 
     * @returns {number} value between 0 and 1 where 0 means not suitable and 1
     * means very suitable.
     */

    if (moon_phase < 355 && moon_phase > 5) { return 0 }
    if (moon_phase >= 355) { moon_phase -= 360 }
    return -(1 / 25) * Math.pow(moon_phase, 2) + 1
}

function calc_moon_altitude_suit(moon_altitude) {
    /** calculates suitability of atro-photography in regard to the moon's altitude.
     * The moon's altitude is given given as angle (-180--+180), where negative degrees
     * indicate that the moon's position is below the horzion.
     * 
     * @param {number} moon_altitude Value in the intervall (-180, 180].
     * 
     * @returns {number} value between 0 and 1 where 0 means not suitable and 1
     * means very suitable.
     */

    // use same calculations as for sun, but shift them 6 degree (suitability for astro
    // photo starts growing when moon is 6 degree over horizon and reaches 1 at -12 degree.)

    moon_altitude = moon_altitude - 6

    if (moon_altitude > 0) { return 0 }
    if (moon_altitude < -18) { return 1 }

    return (1 / 324) * Math.pow(moon_altitude, 2)
}


function calc_cloudcover_suit(cloudcover) {
    /** calculates suitability of atro-photography in regard to cloudcover.
     * Cloudcover is given percentage of cloud covered sky.
     * 
     * @param {number} cloudcover Value from 0 to 100. Percent of cloud covered sky.
     * 
     * @returns {number} value between 0 and 1 where 0 means not suitable and 1
     * means very suitable.
     */

    if (cloudcover > 50) { return 0 }
    return -(1 / 2500) * Math.pow(cloudcover, 2) + 1
}

function calculate_suitability(time_frame) {
    time_frame.suit = {}
    suit_sun_altitude = calc_sun_altitude_suit(time_frame.sun.altitude)
    suit_moon_altitude = calc_moon_altitude_suit(time_frame.moon.altitude)
    suit_moon_phase = calc_moon_phase_suit(time_frame.moon.phase_angle)
    suit_cloudcover = calc_cloudcover_suit(time_frame.cloudcover)

    time_frame.suit.sun_altitude = suit_sun_altitude
    time_frame.suit.moon_altitude = suit_moon_altitude
    time_frame.suit.moon_phase = suit_moon_phase
    time_frame.suit.cloudcover = suit_cloudcover

    time_frame.suit.overall = suit_sun_altitude * suit_moon_altitude * suit_cloudcover
    // if near new moon, ignore altitude
    if (suit_moon_altitude < 1 && suit_moon_phase > 0) { time_frame.suit.overall = suit_sun_altitude * suit_moon_phase * suit_cloudcover }
    return time_frame
}


async function get_time_table(meteo_data) {

    const aggregated = await aggregate_open_meteo(
        data = meteo_data,
        time_frame_len = 3,
        time_frame_nb = 4,
        offset = 17
    );
    let observer = new Astronomy.Observer(aggregated.latitude, aggregated.longitude, aggregated.elevation);
    for (let timeframe of aggregated.timeframes) {
        timeframe = astro_enrich_time_frame(timeframe, observer)
    }

    for (let timeframe of aggregated.timeframes) {
        time_frame = calculate_suitability(timeframe)
    }
    build_time_table(aggregated)
}

