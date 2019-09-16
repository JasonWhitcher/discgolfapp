# Disc Golf Scoring App

## Portfolio Progress Web App

### OVERVIEW
This is a progressive web app.
I mainly created this pwa to learn the skills needed to develop pwa's. It is a basic disc golf scoring app. The user can add players as needed, select the starting hole and set the par for the hole. During game play the user can cycle through holes forward and back, set/change hole par and enter player’s scores for each hole. Players are even allowed to skip holes without impacting score. When the user ends the game, a final scorecard will display for each player.

### HTML
Element ids and classes are prefixed with dg-.
All menu, modal and page containers are on index.html. This was done to give the pwa a seamless app feel.

### CSS
Sass is used for variables and nesting.
Styling is given to input[type=”number”] for a better UI on the ‘number spinner’ elements.

### JAVASCRIPT
Variables and functions are prefixed with dg_.
Note: there are still unused parts in this because I hope to update this pwa with more features in the future.
A 2-d array is used to keep track of hole par, player name, hole score.
Several event listeners are used for opening and closing menu, modal, and page containers as the user moves through the app.
Functions are used to calculate running par and score for the players.
Javascript is used to dynamiclly build some of the html such as: added player list, scoring pages, and final scorecard.
The service worker file is very basic. It caches the required files and serves them locally first.