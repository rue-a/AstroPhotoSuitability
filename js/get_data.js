async function get_meteo_data(lat, lon) {
    const query = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,cloudcover&timezone=auto`;
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
    /** aggregates a given subset of an array of values beginning at index i and ending at index i+len. 
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

function aggregate_meteo_data(data) {
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
            if (i - a == 17) {
                console.log((data.hourly.time[i]))
                console.log((data.hourly.time[i + 3]))
                console.log(new Date((new Date(data.hourly.time[i]).valueOf() + new Date(data.hourly.time[i + 3]).valueOf()) / 2))

                key = `${night_date} 17:00-20:00`
                aggregated[key] = aggregate_time_frame(data.hourly, i, 4)
            }
            if (i - a == 20) {
                key = `${night_date} 20:00-23:00`
                aggregated[key] = aggregate_time_frame(data.hourly, i, 4)
            }
            if (i - a == 23) {
                key = `${night_date} 23:00-02:00`
                aggregated[key] = aggregate_time_frame(data.hourly, i, 4)
            }
            if (i - a == 2) {
                key = `${night_date} 02:00-05:00`
                aggregated[key] = aggregate_time_frame(data.hourly, i, 4)
            }
            if (key) { order_of_keys.push(key) }
        }
        aggregated.order_of_time_frames = order_of_keys
    }
    return aggregated
}

function enrich_with_astro_data(time_frames) {
    /** adds astronomical information such as moon phase or moon visibility to 
     * the time frames. Information is calculated for the center of the timeframe
     * (e.g. 17:00 - 20:00 -> 18:30).
     * 
     */
    let date = new Date()
    console.log(time_frames.latitude, time_frames.longitude, time_frames.elevation)
    let observer = new Astronomy.Observer(time_frames.latitude, time_frames.longitude, time_frames.elevation);
    const moon_eqd = Astronomy.Equator(Astronomy.Body.Moon, date, observer, true, false);
    const hor = Astronomy.Horizon(date, observer, moon_eqd.ra, moon_eqd.dec, 'normal');
    // console.log(hor.azimuth)
    console.log(hor.altitude)

    return time_frames
}

let lat = 51.03
let lon = 13.74
const aggregated = aggregate_meteo_data(sample_meteo_response);
const enriched = enrich_with_astro_data(aggregated);
console.log(enriched)

// get_meteo_data(lat, lon).then((meteo_response) => {
//     let aggregated = aggregate_meteo_data(meteo_response)
//     const enriched = enrich_with_astro_data(aggregated);
//     console.log(enriched)
// })

