// restaurantUtils.js

// Function to create a restaurant object
function createRestaurant(name, locations, cuisine, specials, website) {
    return {
        name: name,
        location: locations,
        cuisine: cuisine,
        specials: specials,
        website: website
    };
}

// Static properties
export const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const restaurantsList = [
    createRestaurant(
      'Postinos',
      ['Buckhead', 'West Midtown'],
      'American',
      { Monday: '$25 for wine and bruschetta board after 8PM', Tuesday: '$25 for wine and bruschetta board after 8PM', Wednesday: '', Thursday: '', Friday: '', Saturday: 'Brunch', Sunday: 'Brunch' },
      'https://www.postinowinecafe.com'
    ),
    createRestaurant(
      'Pachengos',
      ['Buckhead'],
      'Mexican',
      { Monday: '', Tuesday: 'Dive into the deliciousness of $2 Taco Tuesday, all day long! Indulge in mouthwatering options including pollo, asada, pastor, and rajas (veggie). Please note, that this special is exclusive for dine-in only.', Wednesday: 'Calling all industry folks! It\'s Industry Night at Pachengo! Enjoy $5 house tequila shots and complimentary chips & salsa from 5 pm to closing.', Thursday: 'Ladies, gather your squad for Tequila Thursday! Sip on $9 Margaritas, $5 Beer, and $8 Wine from 5 pm to closing. ', Friday: 'Get ready to groove at Pachengo\'s Latino Night! From 6 pm to 10 pm, a live DJ will set the perfect vibe. Plus, enjoy free chips & salsa from 9 pm until closing. It\'s a weekend party you won\'t want to miss!', Saturday: 'Get ready to groove at Pachengo\'s Latino Night! From 6 pm to 10 pm, a live DJ will set the perfect vibe. Plus, enjoy free chips & salsa from 9 pm until closing. It\'s a weekend party you won\'t want to miss!', Sunday: 'Sunday Brunch' },
      'https://www.pachengos.com/'
    ),
    createRestaurant(
      'Gypsy Kitchen',
      ['Buckhead'],
      'American',
      { Monday: 'Happy Hour 4pm-6pm', Tuesday: 'Happy Hour 4pm-6pm', Wednesday: 'Happy Hour 4pm-6pm', Thursday: 'Happy Hour 4pm-6pm', Friday: 'Happy Hour 4pm-6pm', Saturday: 'Brunch', Sunday: 'Brunch' },
      'https://static1.squarespace.com/static/53d80c4ae4b0326a80e22518/t/6321fec22ef3691d15b6d9ee/1663172292262/GKATL-HAPPYHR-web.pdf'
    ),
    createRestaurant(
        'The Iberian Pig',
        ['Buckhead', 'Decatur'],
        'Mexican',
        { Monday: 'Happy Hour 5pm-6pm', Tuesday: 'Happy Hour 5pm-6pm', Wednesday: 'Happy Hour 5pm-6pm', Thursday: 'Happy Hour 5pm-6pm', Friday: 'Happy Hour 4pm-6pm', Saturday: 'Happy Hour 4pm-6pm', Sunday: 'Happy Hour 5pm-6pm' },
        'hhttps://static1.squarespace.com/static/5cb0fcadda50d3755d9e0e77/t/661d5f017d267a1e1d79c079/1713200897801/Happy+Hour+NEW+2024-04-10.pdf'
      ),
      createRestaurant(
        'Industry Tavern',
        ['Buckhead'],
        'American',
        { Monday: 'Mix\'ed Up Monday! $6 EL JIMADOR $5 DOS XX LAGER', Tuesday: 'Tito’s Tuesday! $5 TITO’S VODKA', Wednesday: 'Whiskey Wednesday! $6 JACK DANIELS WHISKEY. Dirty South Trivia 8pm', Thursday: 'Throwback Thursday! $3.5 HIGH LIFE & COORS BANQUET', Friday: 'Forrester Friday! $5 TWISTED TEA WHISKEY $5 TWISTED TEA LITE CANS', Saturday: 'Craft Saturday! $6 CREATURE COMFORTS DRAFT ', Sunday: 'Sunday Funday! HALF PRICED HIGH NOON CANS' },
        'https://www.industrytavern.com/weekly-specials/'
      ),
      createRestaurant(
        'Eclipse di luna',
        ['Buckhead', 'Dunwoody', 'Alpharetta'],
        'American',
        { Monday: 'Happy Hour: $5 Tapas & $5 Margaritas, Mojitos, Sangria, Well Liquor, Beer & Wine (4pm to 6pm) – 1/2 off all bottles of wine', Tuesday: 'Happy Hour: $5 Tapas & $5 Margaritas, Mojitos, Sangria, Well Liquor, Beer & Wine (4pm to 6pm) – $5 Red & White Sangria All Day', Wednesday: 'Happy Hour: $5 Tapas & $5 Margaritas, Mojitos, Sangria, Well Liquor, Beer & Wine (4pm to 6pm) – Half Off All Paellas All Night', Thursday: 'Happy Hour: $5 Tapas & $5 Margaritas, Mojitos, Sangria, Well Liquor, Beer & Wine (4pm to 6pm)', Friday: 'Happy Hour: $5 Tapas & $5 Margaritas, Mojitos, Sangria, Well Liquor, Beer & Wine (4pm to 6pm)', Saturday: '', Sunday: 'Brunch: Bottomless Mimosas & Sangria (12pm to 4pm) + Full Menu All Day' },
        'https://eclipsediluna.com/buckhead-deal/'
      ),
      
    // Add more restaurant objects as needed
  ];

const allLocations = restaurantsList.reduce((locations, restaurant) => {
    restaurant.location.forEach(location => {
        if (!locations.includes(location)) {
            locations.push(location);
        }
    });
    return locations;
}, []);

export const locationOptions = ['All', ...allLocations];


export const cuisineOptions = ['All', 'Italian', 'Mexican', 'American', 'Japanese'];





