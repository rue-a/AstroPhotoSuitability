

function load_marker_shape(url, properties) {
    const pin_div = document.createElement('div'); // Replace with your element ID
    fetch(url)
        .then(response => response.text())
        .then(svgText => {
            pin_div.innerHTML = svgText;
            // Get the path element
            const path = pin_div.querySelector('path');
            const svg = pin_div.querySelector('svg');

            // scale icon
            if (properties.scale) {
                svg.removeAttribute('viewBox')
                path.setAttribute('transform', `scale(${properties.scale})`);
                svg.setAttribute('width', svg.getAttribute('width') * properties.scale)
                svg.setAttribute('height', svg.getAttribute('height') * properties.scale)
            }

            // fill color
            if (properties.fill) { svg.setAttribute('fill', properties.fill) };

            // border color
            if (properties.stroke) { svg.setAttribute('stroke', properties.stroke) };

            // border width
            if (properties.stroke_width) { svg.setAttribute('stroke-width', properties.stroke_width) };

        });
    return pin_div
}

const style = {
    "version": 8,
    "sources": {
        "osm": {
            "type": "raster",
            "tiles": ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
            "tileSize": 256,
            "attribution": "&copy; OpenStreetMap Contributors",
            "maxzoom": 19
        }
    },
    "layers": [
        {
            "id": "osm",
            "type": "raster",
            "source": "osm" // This must match the source key above
        }
    ]
};

var map = new maplibregl.Map({
    container: 'map',
    style: style,
    center: [13, 51],
    zoom: 10
});



const marker = new maplibregl.Marker({
    anchor: "bottom",
    element: load_marker_shape('assets/marker.svg', {
        'scale': 2,
        'fill': 'transparent',
        'stroke': 'black'
    }),
});

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(

        (position) => {
            // set the marker's location to the user's current position
            marker.setLngLat([position.coords.longitude, position.coords.latitude]).addTo(map);
            map.jumpTo({
                center: [position.coords.longitude, position.coords.latitude],
                zoom: 7
            });
            get_meteo_data(position.coords.latitude, position.coords.longitude).then((meteo_data) => {
                const aggregated = aggregate_open_meteo(
                    data = meteo_data,
                    time_frame_len = 2,
                    offset = 17,
                    time_frame_nb = 7
                );

                const heatmap_width = build_heatmap(aggregated)
                set_up_skymap("skymap")
            });
        },
        (error) => {
            console.log(`Error getting location: ${error.message}`);
        }
    );

} else {
    console.log('Geolocation is not supported by this browser.');
}




map.on('click', function (e) {
    marker.setLngLat(e.lngLat).addTo(map);
    // console.log();
    get_meteo_data(e.lngLat.lat, e.lngLat.lng).then((meteo_data) => {
        const aggregated = aggregate_open_meteo(
            data = meteo_data,
            time_frame_len = 2,
            offset = 17,
            time_frame_nb = 7
        );

        const heatmap_width = build_heatmap(aggregated)
        set_up_skymap("skymap")
    });
});


