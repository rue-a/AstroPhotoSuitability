# Readme

This is the source code for the Website [Astrophotography Suitability Dashboard](https://rue-a.github.io/AstroPhotoSuitability/), which helps to plan an astrophotography session. It allows to review the suitability for astrophotography within the next two weeks at a given location on earth. Suitability at a given spatio-temporal instant is quantified by combining the visibility of the moon, the altitude of the sun and the percentage of cloud cover at this location and time. The light pollution deliberately is ignored in this calculation, since many people do not have access to a remote-enough observation site. Additionally, the movement of prominent celestial bodies can be previewed.

__Attributions__
The software uses [Bootstrap](https://getbootstrap.com/) for the layout of the user interface and [D3](https://d3js.org/) for the generation of the graphical elements of the interface. Furthermore, the free weather API [Open-Meteo](https://open-meteo.com/) is leveraged to query weather forecasts. And finally, required data of celestial bodies is calculated with the [Astronomy Engine](https://github.com/cosinekitty/astronomy) JS-library.

## User Interface

The central control element of the Website is the map. When the user open the page, they are asked to if the page is allowed to use their location. If yes, a pin is placed at their location; otherwise they have to click manually on the map to place the pin. Whenever a pin is placed on the map, an API request is sent to open-meteo to retrieve the weather preview for the next two days. For this reason, please do not spam-click on the map; open-meteo might block your IP (their Website asks that you to stay [below 10,000 requests per day](https://open-meteo.com/en/pricing/); still, please do not abuse their generous service).

Subsequently, the suitability preview is calculated. The suitability is presented as a heatmap of time frames. A time frame spans two hours, beginning a 5 p.m. and ending at 7 a.m. for each night of the following two weeks. A time frame is represented by a colored rectangle; where the color identifies the suitability of this time frame; green means suitable and gray means not suitable. If the moon is atop the horizon, its phase is displayed by a moon symbol in the bottom right of each rectangle. On hovering a rectangle, more information about this time frame is presented.

Clicking a rectangle creates a plot of the night sky at this time and for the location of the pin on the map. The night sky preview contains the sun, the moon, all planets, and a selection of beginner-friendly astronomical objects. A future release will include an option for the user to change this selection. Below the night sky preview, the user finds a time slider to change the time of the preview from plus to minus twelve hours from the initially displayed time. As the sun begins rising, the background color of the preview changes to white and vice versa, when it is dawning.


## Suitability calculation

The suitability is calculated as a product of the suitabilities of the sun altitude, the moon altitude and the cloud cover.

- The sun altitude suitability is 1 if the sun is 18° below the horizon; it begins dropping at -18° and reaches 0 at 0°.
- The moon altitude suitability is 1 if the moon is 12° below the horizon; it begins dropping at -12° and reaches 0 at 6°.
- The cloud cover suitability is 0 for cloud cover above 50 %, and begins to rise quadratically for lower values until it reaches 1 at 0 % cloud cover.

If the moon is above the horizon, but the moon phase is near new moon, the suitability is calculated as a product the suitabilities of the sun altitude, the moon phase and the cloud cover. 

- The moon phase suitability is modelled with a quadratic function that is 0 at 360° and that reaches 1 at 355° and 5°.


The source code for the calculations begins [here](https://github.com/rue-a/AstroPhotoSuitability/blob/master/js/aggregate_data.js#L127).