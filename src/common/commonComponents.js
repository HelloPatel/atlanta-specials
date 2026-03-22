// restaurantUtils.js

// Function to create a restaurant object
function createRestaurant(name, locations, cuisine, specials, website) {
  return {
    name: name,
    location: locations,
    cuisine: cuisine,
    specials: specials,
    website: website,
  };
}

// Static properties
export const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const restaurantsList = [
  createRestaurant(
    "Postinos",
    ["Buckhead", "West Midtown"],
    "American",
    {
      Monday: "$25 for wine and bruschetta board after 8PM",
      Tuesday: "$25 for wine and bruschetta board after 8PM",
      Wednesday: "",
      Thursday: "",
      Friday: "",
      Saturday: "Brunch",
      Sunday: "Brunch",
    },
    "https://www.postinowinecafe.com"
  ),
  createRestaurant(
    "Pachengos",
    ["Buckhead"],
    "Mexican",
    {
      Monday: "",
      Tuesday:
        "Dive into the deliciousness of $2 Taco Tuesday, all day long! Indulge in mouthwatering options including pollo, asada, pastor, and rajas (veggie). Please note, that this special is exclusive for dine-in only.",
      Wednesday:
        "Calling all industry folks! It's Industry Night at Pachengo! Enjoy $5 house tequila shots and complimentary chips & salsa from 5 pm to closing.",
      Thursday:
        "Ladies, gather your squad for Tequila Thursday! Sip on $9 Margaritas, $5 Beer, and $8 Wine from 5 pm to closing. ",
      Friday:
        "Get ready to groove at Pachengo's Latino Night! From 6 pm to 10 pm, a live DJ will set the perfect vibe. Plus, enjoy free chips & salsa from 9 pm until closing. It's a weekend party you won't want to miss!",
      Saturday:
        "Get ready to groove at Pachengo's Latino Night! From 6 pm to 10 pm, a live DJ will set the perfect vibe. Plus, enjoy free chips & salsa from 9 pm until closing. It's a weekend party you won't want to miss!",
      Sunday: "Sunday Brunch",
    },
    "https://www.pachengos.com/"
  ),
  createRestaurant(
    "Gypsy Kitchen",
    ["Buckhead"],
    "American",
    {
      Monday: "Happy Hour 4pm-6pm",
      Tuesday: "Happy Hour 4pm-6pm",
      Wednesday: "Happy Hour 4pm-6pm",
      Thursday: "Happy Hour 4pm-6pm",
      Friday: "Happy Hour 4pm-6pm",
      Saturday: "Brunch",
      Sunday: "Brunch",
    },
    "https://static1.squarespace.com/static/53d80c4ae4b0326a80e22518/t/6321fec22ef3691d15b6d9ee/1663172292262/GKATL-HAPPYHR-web.pdf"
  ),
  createRestaurant(
    "The Iberian Pig",
    ["Buckhead", "Decatur"],
    "Mexican",
    {
      Monday: "Happy Hour 5pm-6pm",
      Tuesday: "Happy Hour 5pm-6pm",
      Wednesday: "Happy Hour 5pm-6pm",
      Thursday: "Happy Hour 5pm-6pm",
      Friday: "Happy Hour 4pm-6pm",
      Saturday: "Happy Hour 4pm-6pm",
      Sunday: "Happy Hour 5pm-6pm",
    },
    "hhttps://static1.squarespace.com/static/5cb0fcadda50d3755d9e0e77/t/661d5f017d267a1e1d79c079/1713200897801/Happy+Hour+NEW+2024-04-10.pdf"
  ),
  createRestaurant(
    "Industry Tavern",
    ["Buckhead"],
    "American",
    {
      Monday: "Mix'ed Up Monday! $6 EL JIMADOR $5 DOS XX LAGER",
      Tuesday: "Tito’s Tuesday! $5 TITO’S VODKA",
      Wednesday:
        "Whiskey Wednesday! $6 JACK DANIELS WHISKEY. Dirty South Trivia 8pm",
      Thursday: "Throwback Thursday! $3.5 HIGH LIFE & COORS BANQUET",
      Friday:
        "Forrester Friday! $5 TWISTED TEA WHISKEY $5 TWISTED TEA LITE CANS",
      Saturday: "Craft Saturday! $6 CREATURE COMFORTS DRAFT ",
      Sunday: "Sunday Funday! HALF PRICED HIGH NOON CANS",
    },
    "https://www.industrytavern.com/weekly-specials/"
  ),
  createRestaurant(
    "Eclipse di luna",
    ["Buckhead", "Dunwoody", "Alpharetta"],
    "American",
    {
      Monday:
        "Happy Hour: $5 Tapas & $5 Margaritas, Mojitos, Sangria, Well Liquor, Beer & Wine (4pm to 6pm) – 1/2 off all bottles of wine",
      Tuesday:
        "Happy Hour: $5 Tapas & $5 Margaritas, Mojitos, Sangria, Well Liquor, Beer & Wine (4pm to 6pm) – $5 Red & White Sangria All Day",
      Wednesday:
        "Happy Hour: $5 Tapas & $5 Margaritas, Mojitos, Sangria, Well Liquor, Beer & Wine (4pm to 6pm) – Half Off All Paellas All Night",
      Thursday:
        "Happy Hour: $5 Tapas & $5 Margaritas, Mojitos, Sangria, Well Liquor, Beer & Wine (4pm to 6pm)",
      Friday:
        "Happy Hour: $5 Tapas & $5 Margaritas, Mojitos, Sangria, Well Liquor, Beer & Wine (4pm to 6pm)",
      Saturday: "",
      Sunday:
        "Brunch: Bottomless Mimosas & Sangria (12pm to 4pm) + Full Menu All Day",
    },
    "https://eclipsediluna.com/buckhead-deal/"
  ),
  createRestaurant(
    "5Church",
    ["Buckhead", "Midtown"],
    "American",
    {
      Monday:
        "Happy Hour available at the downstairs bar Monday-Friday from 3-5pm",
      Tuesday:
        "Happy Hour available at the downstairs bar Monday-Friday from 3-5pm",
      Wednesday:
        "Happy Hour available at the downstairs bar Monday-Friday from 3-5pm",
      Thursday:
        "Happy Hour available at the downstairs bar Monday-Friday from 3-5pm",
      Friday:
        "Happy Hour available at the downstairs bar Monday-Friday from 3-5pm",
      Saturday: "",
      Sunday:
        "",
    },
    "https://midtown.5church-atlanta.com/atlanta-midtown-5church-midtown-food-menu"
  ),
  createRestaurant(
    "Superica",
    ["Buckhead", "Midtown", "Alpharetta", "Battery"],
    "Mexican",
    {
      Monday:
        "2:30 PM- 5 PM SIESTA MENU (BAR SERVICE) **Not All Locations**. Lunch specials 11-2:30",
      Tuesday:
        "2:30 PM- 5 PM SIESTA MENU (BAR SERVICE) **Not All Locations**. Lunch specials 11-2:30",
      Wednesday:
        "2:30 PM- 5 PM SIESTA MENU (BAR SERVICE) **Not All Locations**. Lunch specials 11-2:30",
      Thursday:
        "2:30 PM- 5 PM SIESTA MENU (BAR SERVICE) **Not All Locations**. Lunch specials 11-2:30",
      Friday:
        "2:30 PM- 4 PM SIESTA MENU (BAR SERVICE) **Not All Locations**. Lunch specials 11-2:30",
      Saturday: "Brunch",
      Sunday:
        "Brunch",
    },
    "https://superica.com/buckhead/#menus"
  ),
  createRestaurant(
    "Red Pepper Taqueria",
    ["Buckhead", "Brookhaven", "Decatur", "Dunwoody"],
    "Mexican",
    {
      Monday:
        "Dozen Fresh Gulf Oysters for $12 (add chargrilled for $2 more}. $8 Cutwater Mojitos. Happy Hour 3pm-6pm and 9pm to close.",
      Tuesday:
        "Taco Tuesday! All Signature Tacos for $3 (Add $1 for Birria and Carne Asade | $2 for Blackened Salmon. $4 Monday Night Brewing Taco Tuesday. Happy Hour 3pm-6pm and 9pm to close.",
      Wednesday:
        "Wine Wednesday - All Glass and Bottled Wine Half Off. . Happy Hour 3pm-6pm and 9pm to close.",
      Thursday:
        "$3 Pints and $8 Skinny Margaritas. Happy Hour 3pm-6pm and 9pm to close.",
      Friday:
        "$10 Black Sheep Tequila “Agua Azul”. Happy Hour 3pm-6pm and 9pm to close.",
      Saturday: "$20 Bottomless Mimosas from 11am to 4pm",
      Sunday:
        "$20 Bottomless Mimosas from 11am to 4pm",
    },
    "https://www.redpepperatl.com/weekly-specials"
  ),
  createRestaurant(
    "Fados Irish Pub",
    ["Buckhead", "Midtown"],
    "American",
    {
      Monday:"Happy Hour 2pm-7pm",
      Tuesday:"Happy Hour 2pm-7pm",
      Wednesday: "Happy Hour 2pm-7pm",
      Thursday: "Happy Hour 2pm-7pm",
      Friday:"Happy Hour 11:30pm-7pm. $25 Bottomless Mules from 7pm-9pm",
      Saturday: "$17 Bottomless Mimosas until 3pm",
      Sunday:
        "$17 Bottomless Mimosas until 3pm",
    },
    "https://www.fadoirishpub.com/atlanta-menu#menu=atl-specials"
  ),
  createRestaurant(
    "Whiskey Bird",
    ["Midtown"],
    "American",
    {
      Monday:"",
      Tuesday:"Happy Hour 4pm-6pm",
      Wednesday: "Happy Hour 4pm-6pm",
      Thursday: "Happy Hour 4pm-6pm",
      Friday:"Happy Hour 3pm-5:30pm.",
      Saturday: "Happy Hour 3pm-5:30pm.",
      Sunday:
        "Happy Hour 3pm-5:30pm.",
    },
    "https://media-cdn.getbento.com/accounts/aa0c61a8fb9614ce33218fcd789960c7/media/7gwcmpKRMOHb2vllAgmA_HH_MENU_April_2024.pdf"
  ),
  createRestaurant(
    "Establishment",
    ["Midtown"],
    "American",
    {
      Monday:"",
      Tuesday:"4pm - 6pm After Work Specials available for Dine-in only",
      Wednesday: "4pm - 6pm After Work Specials available for Dine-in only",
      Thursday: "4pm - 6pm After Work Specials available for Dine-in only",
      Friday:"4pm - 6pm After Work Specials available for Dine-in only",
      Saturday: "",
      Sunday:
        "",
    },
    "https://establishmentatlanta.com/atlanta-establishment-midtown-food-menu"
  ),
  createRestaurant(
    "Snap Thai",
    ["Buckhead"],
    "Asian",
    {
      Monday:"",
      Tuesday:"Happy Hour 3pm-5:30pm",
      Wednesday: "Happy Hour 3pm-5:30pm",
      Thursday: "Happy Hour 3pm-5:30pm",
      Friday:"Happy Hour 3pm-5:30pm.",
      Saturday: "",
      Sunday:
        "",
    },
    "https://www.snapthaiatl.com/menu"
  ),
  createRestaurant(
    "Beetlecat",
    ["Inman Park"],
    "Seafood",
    {
      Monday: "Oyster Happy Hour: Monday to Friday from 4-5pm",
      Tuesday: "Oyster Happy Hour: Monday to Friday from 4-5pm",
      Wednesday: "Oyster Happy Hour: Monday to Friday from 4-5pm",
      Thursday: "Oyster Happy Hour: Monday to Friday from 4-5pm",
      Friday: "Oyster Happy Hour: Monday to Friday from 4-5pm",
      Saturday: "",
      Sunday: "",
    },
    "https://beetlecatatl.com/"
  ),
  createRestaurant(
    "Biltong Bar",
    ["Ponce City Market"],
    "South African",
    {
      Monday: "Happy Hour: Great deals on snacks and drinks from 12pm onward",
      Tuesday: "Happy Hour: Great deals on snacks and drinks from 12pm onward",
      Wednesday: "Happy Hour: Great deals on snacks and drinks from 12pm onward",
      Thursday: "Happy Hour: Great deals on snacks and drinks from 12pm onward",
      Friday: "Happy Hour: Great deals on snacks and drinks from 12pm onward",
      Saturday: "",
      Sunday: "",
    },
    "https://biltong-bar.com/"
  ),

  // Add more restaurant objects as needed
];

const allLocations = restaurantsList.reduce((locations, restaurant) => {
  restaurant.location.forEach((location) => {
    if (!locations.includes(location)) {
      locations.push(location);
    }
  });
  return locations;
}, []);

export const locationOptions = ["All", ...allLocations];

export const cuisineOptions = [
  "All",
  "Italian",
  "Mexican",
  "American",
  "Asian",
];
