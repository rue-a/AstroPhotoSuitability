

async function get_meteo_data(lat, lon) {
    const query = `https://api.open-meteo.com/v1/gfs?forecast_days=16&latitude=${lat}&longitude=${lon}&hourly=temperature_2m,cloudcover&timezone=auto`;
    const response = await fetch(query)
    const json = await response.json();
    return json;

}

function get_mean(arr) {
    /** calculates the mean value of an array of numbers.
     * 
     * @param {Array.<Number>} arr Array of values.
     * 
     * @returns {Number} The mean value.
     */

    let sum = 0;
    for (val of arr) {
        sum += val;
    }
    return sum / arr.length
}

function aggregate_values(arr, i, len) {
    /** aggregates the values of a given subset of an array beginning at index i and ending at index i+len. 
     *
     * @param {Array.<Number>} arr Array with the parameter's values.
     * @param {Number} i Integer that indicates where in the array the aggregation starts.
     * @param {Number} len Integer that is used to identify the length of the sequence that is aggregated.
     * 
     * @returns {Number} Mean value of aggregated values.
     */

    return get_mean(arr.slice(i, i + len))
}

function aggregate_time_frame(data_hourly, i, len) {
    /**
     * 
     */
    return {
        "temperatur_2m": aggregate_values(data_hourly.temperature_2m, i, len),
        "cloudcover": aggregate_values(data_hourly.cloudcover, i, len)
    }
}

async function load_timezone_ref(url) {
    const response = await fetch(url)
    const json = await response.json();
    return json;
}

async function aggregate_meteo_data(data, agg_len) {
    /** aggregates meteorological data into time frames of 
     * four hours beginning at 17:00 and ending at 05:00
     * 
     * @param {Object} data API response from https://api.open-meteo.com/v1/
     * 
     * @returns {Object} An object with time frames as keys and some auxillary 
     *  information, such as the time zone of the time frames and their order.
     */
    let datetime;
    let night_date;
    let day_counter = 0;
    const order_of_keys = []
    const aggregated = {};
    aggregated.timezone = data.timezone
    aggregated.timezone_abbreviation = data.timezone_abbreviation
    aggregated.latitude = data.latitude
    aggregated.longitude = data.longitude
    aggregated.elevation = data.elevation
    aggregated.units = data.hourly_units
    delete aggregated.units.time
    for (let i in data.hourly.time) {
        i = parseInt(i)

        if (i != 0 && !(i % 24)) { day_counter++; }
        let a = day_counter * 24;
        datetime = new Date(data.hourly.time[i])
        if (i - a == 12) {
            // at 12 noon, switch to next day
            // that means the night_date ist 12
            // hours behind the 'normal' date
            night_date = new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate())
            night_date = night_date.toDateString()
        }
        if (i >= 12 && i < data.hourly.time.length - 12) {
            // ignore first half night and last half night
            let key = null;
            let time = (new Date((new Date(data.hourly.time[i]).valueOf() + new Date(data.hourly.time[i + agg_len - 1]).valueOf()) / 2)).toISOString()

            if (i - a == 17) {
                key = time
                aggregated[key] = aggregate_time_frame(data.hourly, i, agg_len)
                aggregated[key].time_frame_center = time
            }
            if (i - a == 20) {
                key = time
                aggregated[key] = aggregate_time_frame(data.hourly, i, agg_len)
                aggregated[key].time_frame_center = time
            }
            if (i - a == 23) {
                key = time
                aggregated[key] = aggregate_time_frame(data.hourly, i, agg_len)
                aggregated[key].time_frame_center = time
            }
            if (i - a == 2) {
                key = time
                aggregated[key] = aggregate_time_frame(data.hourly, i, agg_len)
                aggregated[key].time_frame_center = time
            }
            if (key) { order_of_keys.push(key) }
        }
        aggregated.order_of_time_frames = order_of_keys
    }
    console.log(aggregated)
    return aggregated
}

function astro_enrich_time_frame(time_frame, observer) {
    /** Enriches a time frame object that contains a time_frame_center
     * with astronomical data, depending on the observer position. 
     */
    const date = new Date(time_frame.time_frame_center);
    // console.log(date)
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
    /** calculates suitability of atro-photography in regard to the sun's altitude.
     * The sun's azimut is given given as angle (-180--+180), where negative degrees
     * indicate that the sun's position is below the horzion.
     * 
     * Civil twilight: sun is 0 to 6 degree below horizon.
     * Nautical twilight: sun is 6 to 12 degree below horizon.
     * Astronomical twilight: sun is 12 to 18 degree below horizon.
     * Night: sun is > 18 degree below horizon.
     * 
     * @param {number} sun_altitude Value in the intervall (-180, 180].
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

function get_sample_time_table() {
    const aggregated = aggregate_meteo_data(sample_meteo_response);
    let observer = new Astronomy.Observer(aggregated.latitude, aggregated.longitude, aggregated.elevation);
    for (let time_frame of aggregated.order_of_time_frames) {
        aggregated[time_frame] = astro_enrich_time_frame(aggregated[time_frame], observer)
    }

    for (let time_frame of aggregated.order_of_time_frames) {
        aggregated[time_frame] = calculate_suitability(aggregated[time_frame])
    }
    build_time_table(aggregated)
}



// console.log(aggregated)

async function get_time_table(meteo_data) {
    let agg_len = 4
    const aggregated = await aggregate_meteo_data(meteo_data, agg_len);
    let observer = new Astronomy.Observer(aggregated.latitude, aggregated.longitude, aggregated.elevation);
    for (let time_frame of aggregated.order_of_time_frames) {
        aggregated[time_frame] = astro_enrich_time_frame(aggregated[time_frame], observer)
    }

    for (let time_frame of aggregated.order_of_time_frames) {
        aggregated[time_frame] = calculate_suitability(aggregated[time_frame])
    }
    build_time_table(aggregated, agg_len)
}

