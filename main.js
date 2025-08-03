const margin = {top: 50, right: 100, bottom: 50, left: 100};
const width = 900 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
const yScaleMultiplier = 3;
const continentMapping = {
    'Asia': ['China', 'India', 'Japan', 'Korea, South', 'Indonesia', 'Pakistan', 'Bangladesh', 'Philippines', 'Vietnam', 'Turkey', 'Iran', 'Thailand', 'Burma', 'Iraq', 'Afghanistan', 'Saudi Arabia', 'Malaysia', 'Uzbekistan', 'Yemen', 'Nepal', 'Korea, North', 'Sri Lanka', 'Kazakhstan', 'Syria', 'Cambodia', 'Jordan', 'Azerbaijan', 'United Arab Emirates', 'Tajikistan', 'Israel', 'Laos', 'Lebanon', 'Kyrgyzstan', 'Timor-Leste', 'Singapore', 'State of Palestine', 'Oman', 'Kuwait', 'Georgia', 'Mongolia', 'Armenia', 'Qatar', 'Bahrain', 'Bhutan', 'Maldives', 'Brunei'],
    'Europe': ['Germany', 'United Kingdom', 'France', 'Italy', 'Spain', 'Poland', 'Ukraine', 'Romania', 'Netherlands', 'Belgium', 'Czechia', 'Greece', 'Portugal', 'Sweden', 'Hungary', 'Belarus', 'Austria', 'Serbia', 'Switzerland', 'Bulgaria', 'Denmark', 'Finland', 'Slovakia', 'Norway', 'Ireland', 'Croatia', 'Bosnia and Herzegovina', 'Moldova', 'Albania', 'Lithuania', 'North Macedonia', 'Slovenia', 'Latvia', 'Estonia', 'Luxembourg', 'Montenegro', 'Malta', 'Iceland', 'Andorra', 'Monaco', 'Liechtenstein', 'San Marino', 'Holy See', 'Russia'],
    'Africa': ['Nigeria', 'Ethiopia', 'Egypt', 'Congo (Kinshasa)', 'Tanzania', 'South Africa', 'Kenya', 'Algeria', 'Sudan', 'Uganda', 'Morocco', 'Angola', 'Mozambique', 'Ghana', 'Madagascar', 'Cameroon', 'Cote d\'Ivoire', 'Niger', 'Burkina Faso', 'Mali', 'Malawi', 'Zambia', 'Chad', 'Somalia', 'Senegal', 'Zimbabwe', 'Rwanda', 'Tunisia', 'Guinea', 'Benin', 'Burundi', 'South Sudan', 'Eritrea', 'Sierra Leone', 'Togo', 'Libya', 'Central African Republic', 'Liberia', 'Mauritania', 'Congo (Brazzaville)', 'Namibia', 'Botswana', 'Gabon', 'Lesotho', 'Guinea-Bissau', 'Equatorial Guinea', 'Mauritius', 'Eswatini', 'Djibouti', 'Comoros', 'Western Sahara', 'Sao Tome and Principe', 'Seychelles'],
    'North America': ['United States', 'United States of America', 'US', 'Mexico', 'Canada', 'Guatemala', 'Haiti', 'Cuba', 'Dominican Republic', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama', 'Jamaica', 'Trinidad and Tobago', 'Belize', 'Bahamas', 'Barbados', 'Saint Lucia', 'Grenada', 'Saint Vincent and the Grenadines', 'Antigua and Barbuda', 'Dominica', 'Saint Kitts and Nevis'],
    'South America': ['Brazil', 'Colombia', 'Argentina', 'Peru', 'Venezuela', 'Chile', 'Ecuador', 'Bolivia', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname'],
    'Oceania': ['Australia', 'Papua New Guinea', 'New Zealand', 'Fiji', 'Solomon Islands', 'Vanuatu'],
    'World': null
};

let currentSlide = 0;
const slides = [
    { mapAreaId: "map-area-1", chartAreaId: "chart-area-1", continent: "Europe" },
    { mapAreaId: "map-area-2", chartAreaId: "chart-area-2", continent: "Asia" },
    { mapAreaId: "map-area-3", chartAreaId: "chart-area-3", continent: "North America" },
    { mapAreaId: "map-area-4", chartAreaId: "chart-area-4", continent: "World", interactive: true }
];

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

function showSlide(index) {
    document.querySelectorAll('.slide').forEach(slide => slide.classList.remove('active'));
    document.getElementById(`slide-${index + 1}`).classList.add('active');
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === slides.length - 1;
    drawVisualization(slides[index]);
    updateProgressBar(index, slides.length);
}

function updateProgressBar(current, total) {
    const progressBar = document.getElementById('progress-bar');
    const progress = ((current + 1) / total) * 100;
    progressBar.style.width = `${progress}%`;
}

prevBtn.addEventListener('click', () => {
    if (currentSlide > 0) {
        currentSlide--;
        showSlide(currentSlide);
    }
});

nextBtn.addEventListener('click', () => {
    if (currentSlide < slides.length - 1) {
        currentSlide++;
        showSlide(currentSlide);
    }
});

function drawVisualization(slide) {
    const mapSvg = d3.select(`#${slide.mapAreaId}`).html("")
        .append("svg")
        .attr("width", 600)
        .attr("height", 400);

    const lineChartSvg = d3.select(`#${slide.chartAreaId}`).html("")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const narrativeText = d3.select(`#slide-${currentSlide + 1} .info-panel h2`);
    
    const xScale = d3.scaleTime().range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%m, %Y"));
    const yAxis = d3.axisLeft(yScale).tickFormat(d3.format(".2s"));

    const lineGenerator = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.cases));

    const covidDataUrl = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv";
    const topojsonUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

    Promise.all([
        d3.csv(covidDataUrl),
        d3.json(topojsonUrl)
    ]).then(([covidData, topoData]) => {
        const dates = covidData.columns.slice(4).map(d => new Date(d));
        const processedData = covidData.flatMap(row => {
            const country = row["Country/Region"];
            const province = row["Province/State"];
            const location = province ? `${country}, ${province}` : country;
            return dates.map(date => ({
                location: location,
                country: country,
                date: date,
                cases: +row[d3.timeFormat("%-m/%-d/%y")(date)]
            }));
        });

        xScale.domain(d3.extent(dates));
        yScale.domain([0, d3.max(processedData, d => d.cases) * yScaleMultiplier]);
        
        lineChartSvg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`).call(xAxis);
        lineChartSvg.append("g").attr("class", "y-axis").call(yAxis);

        const projection = d3.geoMercator();
        const path = d3.geoPath().projection(projection);
        const countries = topojson.feature(topoData, topoData.objects.countries);
        const countriesWithoutAntarctica = {
            ...countries,
            features: countries.features.filter(d => d.properties.name !== "Antarctica")
        };
        
        projection.fitSize([600, 400], countriesWithoutAntarctica);

        mapSvg.append("g")
            .selectAll("path")
            .data(countriesWithoutAntarctica.features)
            .join("path")
            .attr("d", path)
            .attr("fill", "#ccc")
            .attr("stroke", "#fff")
            .style("cursor", "pointer")

        if (slide.interactive) {
            mapSvg.on("click", (event) => {
                if (event.target === mapSvg.node()) {
                    narrativeText.text("Showing COVID-19 cases for the entire world.");
                    updateLineChart("World");
                }
            });

            mapSvg.selectAll("path")
                .on("mouseover", (event, d) => {
                    const hoveredCountryName = d.properties.name;
                    let continentName = Object.keys(continentMapping).find(key => continentMapping[key] && continentMapping[key].includes(hoveredCountryName));
                    if (continentName) {
                        mapSvg.selectAll("path")
                            .filter(c => c.properties && c.properties.name && continentMapping[continentName].includes(c.properties.name))
                            .attr("fill", "steelblue");
                        narrativeText.text(`Hovering over ${continentName}. Click to view data.`);
                    }
                })
                .on("mouseout", (event, d) => {
                    mapSvg.selectAll("path").attr("fill", "#ccc");
                    narrativeText.text("Click on a continent to see the COVID-19 cases in that region.");
                })
                .on("click", (event, d) => {
                    const clickedCountryName = d.properties.name;
                    const continentName = Object.keys(continentMapping).find(key => continentMapping[key] && continentMapping[key].includes(clickedCountryName));
                    if (continentName) {
                        narrativeText.text(`Showing COVID-19 cases for ${continentName}.`);
                        updateLineChart(continentName);
                    }
                });
        } else {
            const continentName = slide.continent;
            if (continentName && continentMapping[continentName]) {
                mapSvg.selectAll("path")
                    .filter(c => c.properties && c.properties.name && continentMapping[continentName].includes(c.properties.name))
                    .attr("fill", "steelblue");
            }
        }

        function updateLineChart(continent) {
            lineChartSvg.selectAll(".line").remove();
            let filteredData;
            if (continent === "World") {
                const allCasesByDate = d3.rollup(processedData, v => d3.sum(v, d => d.cases), d => d.date);
                filteredData = [{ key: "World", value: Array.from(allCasesByDate, ([date, cases]) => ({date, cases})).sort((a, b) => a.date - b.date) }];
            } else {
                const countriesInContinent = continentMapping[continent] || [];
                const dataForContinent = processedData.filter(d => countriesInContinent.includes(d.country));
                const allCasesByDate = d3.rollup(dataForContinent, v => d3.sum(v, d => d.cases), d => d.date);
                filteredData = [{ key: continent, value: Array.from(allCasesByDate, ([date, cases]) => ({date, cases})).sort((a, b) => a.date - b.date) }];
            }

            const lines = lineChartSvg.selectAll(".line")
                .data(filteredData, d => d.key);

            lines.join(
                enter => enter.append("path")
                    .attr("class", "line")
                    .attr("d", d => lineGenerator(d.value))
                    .style("stroke", "steelblue")
                    .style("stroke-width", "2px")
                    .style("fill", "none")
                    .style("opacity", 0)
                    .transition().duration(750).style("opacity", 1),
                update => update
                    .transition().duration(750)
                    .attr("d", d => lineGenerator(d.value))
                    .style("stroke", "steelblue")
                    .style("stroke-width", "2px")
                    .style("fill", "none")
                    .style("opacity", 1),
                exit => exit.transition().duration(750).style("opacity", 0).remove()
            );
        }
        
        updateLineChart(slide.continent);
    }).catch(error => console.error("Error loading data:", error));
}

showSlide(currentSlide);