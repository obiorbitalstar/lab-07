'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
// Application Setup
const PORT = process.env.PORT;
const app = express();
app.use(cors());

app.get('/', (request, response) => {
  response.send('Home Page!');
});

// Route Definitions
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get(`/trails`,trailsHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);


// Route Handlers

function locationHandler(request, response) {
  const city = request.query.city;
  superagent(
    `https://eu1.locationiq.com/v1/search.php?key=${process.env.GEOCODE_API_KEY}&q=${city}&format=json`
  )
    .then((res) => {
      const geoData = res.body;
      const locationData = new Location(city, geoData);
      response.status(200).json(locationData);
    })
    .catch((err) => errorHandler(err, request, response));
}

function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}

function weatherHandler(request, response) {

  superagent(`https://api.weatherbit.io/v2.0/forecast/daily?city=${request.query.search_query}&key=${process.env.WEATHER_API_KEY}`
  )
    .then((weatherRes) => {
      console.log(weatherRes);
      const weatherSummaries = weatherRes.body.data.map((day) => {
        return new Weather(day);
      });
      response.status(200).json(weatherSummaries);
    })
    .catch((err) => errorHandler(err, request, response));
}

function Weather(day) {
  this.forecast = day.weather.description;
  this.time = new Date(day.valid_date).toString().slice(0, 15);
}


function trailsHandler (request,response){
  const lan = request.query.latitude;
  const long = request.query.longitude;

  getTrailData(lan,long).then(trailData=>{
    response.status(200).json(trailData);
  });


}
function getTrailData(lan,long){

  superagent(`https://www.hikingproject.com/data/get-trails?lat=${lan}&lon=${long}&maxDistance=400&key=${process.env.TRAIL_API_KEY}`)
    .then ( hiking =>{
      let trailsInfo = hiking.body.trails.map(val=>{
        return new Trails(val);
      });
      return trailsInfo;
    });
}

function Trails(walks){
  this.name= walks.name;
  this.location= walks.location;
  this.length = walks.length;
  this.stars = walks.stars;
  this.starVotes= walks.starVotes;
  this.summary= walks.summary;
  this.trail_url= walks.url;
  this.conditions= walks.conditionDetails;
  this.condition_date= walks.conditionDate.substring(0,11);
  this.condition_time = walks.conditionDate.substring(11);

}



function notFoundHandler(request, response) {
  response.status(404).send('huh?');
}

function errorHandler(error, request, response) {
  response.status(500).send(error);
}

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`App is listening on ${PORT}`));
