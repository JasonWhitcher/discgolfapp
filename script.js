/*
Javascript for pwa-disc-golf
*/

/* Init variables */
var dg_current_hole = 0;
var dg_scorecard = [];
var dg_temporary_player_list = [];
var dg_current_context_modal = 'closed'; // Value is the element id of the modal section. 'closed' is no modal showing.
var dg_current_context_page = 'closed';

dg_scorecard = [];

/* Events */

window.onload = function(){
	document.getElementById('dg-main-menu-button').addEventListener('click', function(){
		dg_show_hide_menu('dg-menu-container');
	});
	document.getElementById('dg-start-game-menu-link').addEventListener('click', function(){
		dg_show_modal('dg-start-game');
	});
	document.getElementById('dg-change-par-menu-link').addEventListener('click', function(){
		dg_show_modal('dg-set-par-container');
		dg_display_set_par();
	});
	document.getElementById('dg-button-start-game').addEventListener('click', function(){
		dg_start_game();
	});
	document.getElementById('dg-button-add-player').addEventListener('click', function(){
		this.disabled = true;
		dg_add_player();
		this.disabled = false;
	});
	document.getElementById('dg-button-add-player-finish').addEventListener('click', function(){
		dg_add_player_finish();
	});
	document.getElementById('dg-button-set-starting-hole').addEventListener('click', function(){
		this.disabled = true;
		dg_enter_starting_hole();
		this.disabled = false;
	});
	document.getElementById('dg-button-set-par').addEventListener('click', function(){
		this.disabled = true;
		dg_set_par();
		this.disabled = false;
	});
	document.getElementById('dg-end-game-menu-link').addEventListener('click', function(){
		this.disabled = true;
		dg_hide_page(dg_current_context_page);
		dg_show_page('dg-scorecard-container');
		dg_display_scorecard_page();
		for (var x = 1; x <= dg_scorecard.length - 1; x++){ // -1 to account for index 0 (hole par).
			dg_show_player_scorecard(x);
		}
		this.disabled = false;
	});

	
	/*** Register Service Worker for the PWA ***/
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('service-worker.js')
			.then(function(){ console.log('Service Worker Registered'); });
	}

};


/* Event functions */

function dg_input_number_incrementor(dg_button){
	dg_input_number_field = dg_button.parentNode.querySelector('input[type=number]');
	dg_input_number_field.stepUp();
};
function dg_input_number_decrementor(dg_button){
	var dg_input_number_field = dg_button.parentNode.querySelector('input[type=number]');
	// Allow value of 0. Par of 0 indicates the hole is not played.
	if (dg_input_number_field.value > 0){
		dg_input_number_field.stepDown();
	}
	else {
		dg_input_number_field.value = 0;
	}
};

function dg_main_scoring_update_score(dg_button, playerid){
	// Get necessary elements into variables.
	var dg_input_number_field = dg_button.parentNode.querySelector('input[type=number]');
	var dg_element_relative_par = dg_button.parentNode.parentNode.parentNode.getElementsByClassName('dg-main-scoring-player-score-total')[0].getElementsByClassName('dg-main-scoring-relative-par')[0];
	var dg_element_score_total = dg_button.parentNode.parentNode.parentNode.getElementsByClassName('dg-main-scoring-player-score-total')[0].getElementsByClassName('dg-main-scoring-score-total')[0];

	// Update the score.
	dg_scorecard[playerid][dg_current_hole] = dg_input_number_field.value;
	var dg_relative_par = parseInt(dg_get_relative_par(playerid));// + parseInt(dg_input_number_field.value);
	if ( dg_relative_par >= 0 ){ // Need to add the + sign to positive par.
		dg_element_relative_par.innerHTML = '+' + dg_relative_par;
	} else {
		dg_element_relative_par.innerHTML = dg_relative_par;
	}
	dg_element_score_total.innerHTML = dg_get_score_total(playerid);// + parseInt(dg_input_number_field.value);
}

/**
  Description: 		Add a player name to dg_scorecard.
  @param {string} 	A player name.
  @return none
*/
function dg_add_player_to_scorecard(playername){
	dg_scorecard.push(playername);
}

/**
  Description: 		Initialize the second dimension of the dg_scorecard array.
  @param player_list {array} 	Array list of player names for the dg_scorecard[0]
  @return none
*/
function dg_init_scorecard(player_list){
	for ( var playerid = 0; playerid < player_list.length; playerid++ ) {
		dg_scorecard.push( [] );
		dg_scorecard[playerid].push(player_list[playerid]);
	}
}

/**
  Description: 		Calculate a player's score and return formatted for display.
  @param  playerid 		  {int}
  @return score_formatted {string}  In a format of: +5(55)
*/
function dg_get_score_total_formatted(playerid){
	var score_formatted = '';
	var total_score = dg_get_score_total(playerid);
	var total_par = dg_get_game_par(playerid); // Is this line needed?
	var relative_par = dg_get_relative_par(playerid);
	if ( relative_par >= 0 ){
		score_formatted = '+' + relative_par + '(' + total_score + ')';
	} else {
		score_formatted = '-' + Math.abs(relative_par) + '(' + total_score + ')';
	}
	return score_formatted;
}

/**
  Description: 		Calculate a player's score.
  @param  playerid 		{int}
  @return total_score   {int}  Player's total score
*/
function dg_get_score_total(playerid){
	var total_score = 0;
	var holes_played = dg_scorecard[playerid].length - 1; // -1 to compensate for index 0 (player name).
	for ( var hole_number = 1; hole_number <= holes_played; hole_number++ ){
		if ( parseInt(dg_scorecard[0][hole_number]) > 0 ){ // Check to see if the hole par is not 0 (hole not played). 
			total_score += parseInt(dg_scorecard[playerid][hole_number]);
		}
	}
	return total_score;
}

/**
  Description: 		Calculate the total par for the current player for all holes played.
  					If the player's score for any hole is 0 then the hole's relative par is
  					not calculated into the player's total relative par. This would allow a
  					player to skip playing a hole if they want. 
  @param  {playerid}
  @return total_par    {int}  Total par for all holes played.
*/
function dg_get_game_par(playerid){
	var total_par = 0;
	var holes_played = dg_scorecard[playerid].length - 1;
	for ( var hole_number = 1; hole_number <= holes_played; hole_number++ ){
		if ( parseInt(dg_scorecard[playerid][hole_number]) != 0 ){
			if ( dg_scorecard[0][hole_number] > 0 ){
				total_par += parseInt(dg_scorecard[0][hole_number]);
			}
		}
	}
	return total_par;
}

/**
  Description: 		Calculate the players + or - value of par.
  @param  playerid 	  {int}
  @return total_par   {int}  The relative par for the player.
*/
function dg_get_relative_par(playerid){
	var relative_par = 0;
	var total_score = parseInt(dg_get_score_total(playerid));
	var total_par = parseInt(dg_get_game_par(playerid));
	relative_par = total_score - total_par;
	return relative_par;
}

/**
  Description: Hides or shows modal screens. Uses a toggle function to preform this.
  @param {string} current_context The element's id the action will be preformed on.
  @return none
*/
function dg_show_hide_menu(current_context){
	if ( dg_current_hole > 0 ) {
		document.getElementById('dg-start-game-menu-link').style.display = 'none';
		document.getElementById('dg-end-game-menu-link').style.display = 'block';
		document.getElementById('dg-change-par-menu-link').style.display = 'block';
	} else {
		document.getElementById('dg-start-game-menu-link').style.display = 'block';
		document.getElementById('dg-end-game-menu-link').style.display = 'none';
		document.getElementById('dg-change-par-menu-link').style.display = 'none';
	}
	document.getElementById(current_context).classList.toggle('dg-show');
};
/**
  Description: Shows modal screen.
  @param {string} current_context The element's id the action will be preformed on.
  @return none
*/
function dg_show_modal(current_context){
	// Need to make sure the menu is closed when a modal is shown.
	if ( document.getElementById('dg-menu-container').classList.contains('dg-show') ) {
		dg_show_hide_menu('dg-menu-container');
	}
	// Need to make sure that the modal context is closed.
	if(dg_current_context_modal != 'closed'){
		dg_hide_modal(dg_current_context_modal);
	}
	// Need to make sure the page is not shown.
	if ( dg_current_context_page != 'closed' ){
		document.getElementById(dg_current_context_page).classList.remove('dg-show');
	}
	document.getElementById(current_context).classList.add('dg-show'); // Show the modal.
	dg_current_context_modal = current_context;
};
/**
  Description: Hides modal screen.
  @param {string} current_context The element's id the action will be preformed on.
  @return none
*/
function dg_hide_modal(current_context){
	document.getElementById(current_context).classList.remove('dg-show');
	dg_current_context_modal = 'closed';
}
/**
  Description: Shows page screen.
  @param {string} current_context The element's id the action will be preformed on.
  @return none
*/
function dg_show_page(current_context){
	// Need to make sure the menu is closed when a  is shown.
	if ( document.getElementById('dg-menu-container').classList.contains('dg-show') ) {
		dg_show_hide_menu('dg-menu-container');
	}
	// Need to make sure that the page context is closed.
	if(dg_current_context_page != 'closed'){
		dg_hide_page(dg_current_context_page);
	}
	document.getElementById(current_context).classList.add('dg-show');
	dg_current_context_page = current_context;

	// Check to see if the current hole's par is set.
	if ( dg_scorecard[0][dg_current_hole] <= 0 || dg_scorecard[0][dg_current_hole] == undefined ) {
		dg_hide_page(dg_current_context_page);
		dg_show_modal('dg-set-par-container');
		dg_display_set_par();
	}

	// Get DOM elements
	var dg_main_scoring_current_hole = document.getElementById('dg-main-scoring-current-hole');
	var dg_main_scoring_current_par = document.getElementById('dg-main-scoring-current-par');
	
	// Display current hole
	var text_node_current_hole = document.createTextNode(dg_current_hole);
	dg_main_scoring_current_hole.innerHTML = '';
	dg_main_scoring_current_hole.appendChild(text_node_current_hole);
	// Display current par
	var text_node_current_par = document.createTextNode(dg_scorecard[0][dg_current_hole]);
	dg_main_scoring_current_par.innerHTML = '';
	dg_main_scoring_current_par.appendChild(text_node_current_par);

	// Dispay player names and scores
	var dg_main_scoring_current_hole_score;
	var dg_main_scoring_details_element = document.getElementById('dg-main-scoring-details');
	dg_main_scoring_details_element.innerHTML = ''; // Clear the scoring list container.
	for ( var playerid = 1; playerid <= dg_scorecard.length - 1; playerid++ ){
		if ( Number.isInteger(parseInt( dg_scorecard[playerid][dg_current_hole]) ) ){
			dg_main_scoring_current_hole_score = parseInt( dg_scorecard[playerid][dg_current_hole] );
		} else {
			dg_main_scoring_current_hole_score = parseInt(0);
		}
		dg_scoring_line_content  = '<div class="dg-main-scoring-line" data-playerid="' + playerid + '">';
		dg_scoring_line_content +=   '<div class="dg-main-scoring-player-name">' + dg_scorecard[playerid][0] + '</div>';
		dg_scoring_line_content +=   '<div class="dg-main-scoring-player-score-total">';
		dg_scoring_line_content +=     '<span class="dg-main-scoring-relative-par">' + (dg_get_relative_par(playerid) >= 0 ? '+' : '') + dg_get_relative_par(playerid) + '</span>';
		dg_scoring_line_content +=     '(<span class="dg-main-scoring-score-total">' + dg_get_score_total(playerid) + '</span>)';
		dg_scoring_line_content +=   '</div>';
		dg_scoring_line_content +=   '<div class="dg-main-scoring-number-container-outer">';
		dg_scoring_line_content +=     '<div class="dg-main-scoring-number-container dg-number-input">';
		dg_scoring_line_content +=       '<input onclick="dg_input_number_decrementor(this); dg_main_scoring_update_score(this, ' + playerid + ')" type="button" class="dg-incrementor" value="-" data-operator="subtract">';
		//dg_scoring_line_content +=       '<input type="number" class="dg-main-scoring-player-hole-score" name="" value="' + ( Number.isInteger(dg_scorecard[playerid][dg_current_hole]) ? dg_scorecard[playerid][dg_current_hole] : '0' ) + '">';
		dg_scoring_line_content +=       '<input type="number" class="dg-main-scoring-player-hole-score" name="" value="' + dg_main_scoring_current_hole_score + '">';
		dg_scoring_line_content +=       '<input onclick="dg_input_number_incrementor(this); dg_main_scoring_update_score(this, ' + playerid + ')" type="button" class="dg-incrementor" value="+" data-operator="add">';
		dg_scoring_line_content +=     '<div>';
		dg_scoring_line_content +=   '</div>';
		dg_scoring_line_content += '</div>';
		dg_main_scoring_details_element.insertAdjacentHTML('beforeend', dg_scoring_line_content);
	}
}
/**
  Description: Hides page screen.
  @param {string} current_context The element's id the action will be preformed on.
  @return {void}
*/
function dg_hide_page(current_context){
	document.getElementById(current_context).classList.remove('dg-show');
}
/**
  Description: 	This function runs on the Previous or Next buttons are clicked.
  				It changes the current hole accordingly. Update the scorecard array.
  				Show updated main scoring page.
  @param {object} 	The button object on the DOM that is clicked.
  @return {void}
*/
function dg_main_scoring_change_hole(dg_button){
	var playerid;
	var dg_pn = dg_button.getAttribute('id');
	var dg_elements_main_scoring_line = document.getElementsByClassName('dg-main-scoring-line');
	// Previous button should do nothing if current hole is 1.
	if ( dg_current_hole == 1 && dg_pn == 'dg-main-scoring-previous'){
		return;
	}
	// Update scorecard array
	for (x = 0; x < dg_elements_main_scoring_line.length; x++){
		playerid = dg_elements_main_scoring_line[x].getAttribute('data-playerid')
		dg_player_score_current_hole = dg_elements_main_scoring_line[x].getElementsByClassName('dg-main-scoring-number-container-outer')[0].getElementsByClassName('dg-main-scoring-number-container')[0].getElementsByClassName('dg-main-scoring-player-hole-score')[0].value;
		dg_scorecard[playerid][dg_current_hole] = dg_player_score_current_hole;
	}
	// Change the current hole
	if ( dg_pn == 'dg-main-scoring-next' ){
		dg_current_hole = parseInt(dg_current_hole) + parseInt(1);
	} else {
		dg_current_hole = parseInt(dg_current_hole) - parseInt(1);
	}
	// Hide current page context
	dg_hide_page(dg_current_context_page);
	// Show scoring page
	dg_show_page(dg_current_context_page);
}
/**
  Description: Function to start a new game.
  @param	none
  @return	none
*/
function dg_start_game(){
	// Reset this variable for each game restart.
	dg_temporary_player_list = [];
	dg_temporary_player_list.push('General Course'); // Set index 0 to the course name per the scorecard template./
	
	for (var x = 0; x < dg_scorecard.length; x++) {
		dg_scorecard[x] = [];
	
	}
	dg_scorecard.length = 0;
	dg_hide_modal(dg_current_context_modal);
	dg_current_context_modal = 'dg-add-players-container';
	dg_show_modal(dg_current_context_modal);
	document.getElementById('dg-add-player-input').value = null; // Clear the add player field.
	document.getElementById('dg-add-player-input').focus(); // Set the focus to the input field.
	document.getElementById('dg-add-player-list').innerHTML = ''; // Clear the player list.
}

/**
  Description: Function to add player names to the game.
  @param	none
  @return	none
*/
function dg_add_player(){
	var dg_player_list = document.getElementById('dg-add-player-list');
	var dg_player_input_field = document.getElementById('dg-add-player-input');
	var dg_player_to_add = dg_player_input_field.value;
	if ( dg_player_to_add != "" ) {
		// Add player name to the temporary array
			dg_temporary_player_list.push(dg_player_to_add);
		// Update the player list on screen.
			var p_element = document.createElement("p");
			var text_node = document.createTextNode(dg_player_to_add);
			p_element.appendChild(text_node);
			dg_player_list.appendChild(p_element);
	}
	dg_player_input_field.value = null; // Clear the input field.
	dg_player_input_field.focus(); // Set the focus to the input field.
	if ( dg_temporary_player_list.length > 1 ) {
		// Remove disabled attribute from 'finish' button.
		document.getElementById('dg-button-add-player-finish').disabled = false;
	}
}

/**
  Description: 	Function to finish entering players.
				Clean up current modal and setup for the next.
  @param	none
  @return	none
*/
function dg_add_player_finish(){
	dg_init_scorecard(dg_temporary_player_list); // Add players to dg_scorecard array.
	dg_hide_modal(dg_current_context_modal);
	dg_current_context_modal = 'dg-starting-hole-container';
	document.getElementById('dg-starting-hole-input').value = 1; // Reset starting hole input to 1 

	dg_show_modal(dg_current_context_modal);
}

/**
  Description: Function to select the starting hole for the game.
  @param	none
  @return	none
*/
function dg_enter_starting_hole(){
	var starting_hole_input_field = document.getElementById('dg-starting-hole-input');
	var number_of_players = dg_scorecard.length;
	dg_current_hole = starting_hole_input_field.value;
	if ( dg_current_hole >= 1 ) {
		// Set all player scores and par to -1 for all previous holes. Set to 0 for current hole.
		for (var playerid = 0; playerid < number_of_players; playerid++){
			for (hole = 0; hole < dg_current_hole - 1; hole++) {
				dg_scorecard[playerid].push(0); // All previous holes scores and par set to 0(represents hole not played).
			}
			dg_scorecard[playerid].push(0); // Current hole score and par set to 0.
		}
	}
	// Set page context and change display to main scoring page.
	dg_hide_modal(dg_current_context_modal);
	dg_show_page('dg-main-scoring-container');
}

/**
  Description: Function to set up the 'change par' page for the current hole.
  @param	none
  @return	none
*/
function dg_display_set_par(){
	// Reset the input field to 1.
	document.getElementById('dg-set-par-input').value = 1;
	var dg_current_hole_element = document.getElementById('dg-set-par-current-hole');
	dg_current_hole_element.innerHTML = dg_current_hole;
}

/**
  Description: Function to set the current hole's par.
  			   Then, return to main scoring page.
  			   This function responds to a click event.
  @param	none
  @return	none
*/
function dg_set_par(){
	var dg_current_par = document.getElementById('dg-set-par-input').value;
	dg_scorecard[0][dg_current_hole] = dg_current_par;
	for ( playerid = 1; playerid <= dg_scorecard.length - 1; playerid++ ){
		// If the hole has not been played, set the player's inital score in
		// the array to 0. This allows calculation of total score.
		if (dg_scorecard[playerid][dg_current_hole] == undefined) {
			dg_scorecard[playerid][dg_current_hole] = 0;
		}
	}
	var number_of_players = dg_scorecard.length;
	for (playerid = 0; playerid < number_of_players; playerid++){
		for (hole = 0; hole <= dg_current_hole; hole++) {
		}
	}
	dg_hide_modal(dg_current_context_modal);
	dg_show_page(dg_current_context_page);
}

/**
  Description: Sets up the game's final scorecard for all players.
  			   This is a blank scorecard for each player with a data-playerid="{playerid}" attribute.
			   Another function will populate the scorecard with the scores.
  @param	none
  @return	none
*/
function dg_display_scorecard_page(){
	dg_current_hole = 0; // Initalize end of game. This also contextual menu items to update.
	var dg_display_markup = '';
	var dg_scorecard_page_element = document.getElementById('dg-scorecard-container');
	dg_scorecard_page_element.innerHTML = '';
	// Loop through each player to display scorecard for each one.
	for (var playerid = 1; playerid <= dg_scorecard.length - 1; playerid++) { // -1 to account for index 0 (par).
		dg_display_markup = '<div class="dg-scorecard-player-container" data-playerid="' + playerid + '">';
		dg_display_markup +=	'<h3 class="dg-scorecard-player-heading">';
		dg_display_markup +=		'<span class="dg-scorecard-player-name">Player name</span>';
		dg_display_markup +=		'<span class="dg-scorecard-score-total">+11(11)</span>';
		dg_display_markup +=	'</h3>';
		dg_display_markup +=	'<table class="dg-scorecard-table dg-scorecard-holes-1-9"> <!-- Holes 1-9 -->';
		dg_display_markup +=		'<!--<caption>Holes 1-9</caption>-->';
		dg_display_markup +=		'<colgroup>';
		dg_display_markup +=			'<col class="dg-hole-1"></col><!-- Use js to assign style attr (bgcolor) on the col tag -->';
		dg_display_markup +=			'<col class="dg-hole-2"></col>';
		dg_display_markup +=			'<col class="dg-hole-3"></col>';
		dg_display_markup +=			'<col class="dg-hole-4"></col>';
		dg_display_markup +=			'<col class="dg-hole-5"></col>';
		dg_display_markup +=			'<col class="dg-hole-6"></col>';
		dg_display_markup +=			'<col class="dg-hole-7"></col>';
		dg_display_markup +=			'<col class="dg-hole-8"></col>';
		dg_display_markup +=			'<col class="dg-hole-9"></col>';
		dg_display_markup +=		'</colgroup>';
		dg_display_markup +=		'<thead>';
		dg_display_markup +=			'<tr class="dg-scorecard-hole-number"> <!-- Hole number -->';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-1">1</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-2">2</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-3">3</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-4">4</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-5">5</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-6">6</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-7">7</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-8">8</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-9">9</th>';
		dg_display_markup +=			'</tr>';
		dg_display_markup +=		'</thead>';
		dg_display_markup +=		'<tbody>';
		dg_display_markup +=			'<tr class="dg-scorecard-hole-par"> <!-- Hole par -->';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-1">test</td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-2"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-3"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-4"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-5"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-6"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-7"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-8"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-9"></td>';
		dg_display_markup +=			'</tr>';
		dg_display_markup +=			'<tr class="dg-scorecard-hole-score"> <!-- Hole score -->';
		dg_display_markup +=				'<td class="dg-scorecard-score-1"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-2"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-3"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-4"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-5"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-6"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-7"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-8"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-9"></td>';
		dg_display_markup +=			'</tr>';
		dg_display_markup +=		'</tbody>';
		dg_display_markup +=	'</table>';
		dg_display_markup +=	'<table class="dg-scorecard-table dg-scorecard-holes-10-18"> <!-- Holes 10-18 -->';
		dg_display_markup +=		'<!--<caption>Holes 10-18</caption>-->';
		dg_display_markup +=		'<colgroup>';
		dg_display_markup +=			'<col class="dg-hole-10"></col><!-- Use js to assign style attr (bgcolor) on the col =tag -->';
		dg_display_markup +=			'<col class="dg-hole-11"></col>';
		dg_display_markup +=			'<col class="dg-hole-12"></col>';
		dg_display_markup +=			'<col class="dg-hole-13"></col>';
		dg_display_markup +=			'<col class="dg-hole-14"></col>';
		dg_display_markup +=			'<col class="dg-hole-15"></col>';
		dg_display_markup +=			'<col class="dg-hole-16"></col>';
		dg_display_markup +=			'<col class="dg-hole-17"></col>';
		dg_display_markup +=			'<col class="dg-hole-18"></col>';
		dg_display_markup +=		'</colgroup>';
		dg_display_markup +=		'<thead>';
		dg_display_markup +=			'<tr class="dg-scorecard-hole-number"> <!-- Hole number -->';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-10">10</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-11">11</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-12">12</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-13">13</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-14">14</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-15">15</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-16">16</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-17">17</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-18">18</th>';
		dg_display_markup +=			'</tr>';
		dg_display_markup +=		'</thead>';
		dg_display_markup +=		'<tbody>';
		dg_display_markup +=			'<tr class="dg-scorecard-hole-par"> <!-- Hole par -->';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-10"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-11"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-12"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-13"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-14"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-15"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-16"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-17"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-18"></td>';
		dg_display_markup +=			'</tr>';
		dg_display_markup +=			'<tr class="dg-scorecard-hole-score"> <!-- Hole score -->';
		dg_display_markup +=				'<td class="dg-scorecard-score-10"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-11"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-12"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-13"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-14"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-15"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-16"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-17"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-18"></td>';
		dg_display_markup +=			'</tr>';
		dg_display_markup +=		'</tbody>';
		dg_display_markup +=	'</table>';
		dg_display_markup +=	'<table class="dg-scorecard-table dg-scorecard-holes-19-27"> <!-- Holes 19-27 -->';
		dg_display_markup +=		'<!--<caption>Holes 19-27</caption>-->';
		dg_display_markup +=		'<colgroup>';
		dg_display_markup +=			'<col class="dg-hole-19"></col><!-- Use js to assign style attr (bgcolor) on the col tag -->';
		dg_display_markup +=			'<col class="dg-hole-20"></col>';
		dg_display_markup +=			'<col class="dg-hole-21"></col>';
		dg_display_markup +=			'<col class="dg-hole-22"></col>';
		dg_display_markup +=			'<col class="dg-hole-23"></col>';
		dg_display_markup +=			'<col class="dg-hole-24"></col>';
		dg_display_markup +=			'<col class="dg-hole-25"></col>';
		dg_display_markup +=			'<col class="dg-hole-26"></col>';
		dg_display_markup +=			'<col class="dg-hole-27"></col>';
		dg_display_markup +=		'</colgroup>';
		dg_display_markup +=		'<thead>';
		dg_display_markup +=			'<tr class="dg-scorecard-hole-number"> <!-- Hole number -->';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-19">19</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-20">20</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-21">21</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-22">22</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-23">23</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-24">24</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-25">25</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-26">26</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-27">27</th>';
		dg_display_markup +=			'</tr>';
		dg_display_markup +=		'</thead>';
		dg_display_markup +=		'<tbody>';
		dg_display_markup +=			'<tr class="dg-scorecard-hole-par"> <!-- Hole par -->';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-19"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-20"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-21"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-22"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-23"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-24"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-25"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-26"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-27"></td>';
		dg_display_markup +=			'</tr>';
		dg_display_markup +=			'<tr class="dg-scorecard-hole-score"> <!-- Hole score -->';
		dg_display_markup +=				'<td class="dg-scorecard-score-19"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-20"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-21"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-22"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-23"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-24"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-25"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-26"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-27"></td>';
		dg_display_markup +=			'</tr>';
		dg_display_markup +=		'</tbody>';
		dg_display_markup +=	'</table>';
		dg_display_markup +=	'<table class="dg-scorecard-table dg-scorecard-holes-28-36"> <!-- Holes 28-36 -->';
		dg_display_markup +=		'<!--<caption>Holes 28-36</caption>-->';
		dg_display_markup +=		'<colgroup>';
		dg_display_markup +=			'<col class="dg-hole-28"></col><!-- Use js to assign style attr (bgcolor) on the col tag -->';
		dg_display_markup +=			'<col class="dg-hole-29"></col>';
		dg_display_markup +=			'<col class="dg-hole-30"></col>';
		dg_display_markup +=			'<col class="dg-hole-31"></col>';
		dg_display_markup +=			'<col class="dg-hole-32"></col>';
		dg_display_markup +=			'<col class="dg-hole-33"></col>';
		dg_display_markup +=			'<col class="dg-hole-34"></col>';
		dg_display_markup +=			'<col class="dg-hole-35"></col>';
		dg_display_markup +=			'<col class="dg-hole-36"></col>';
		dg_display_markup +=		'</colgroup>';
		dg_display_markup +=		'<thead>';
		dg_display_markup +=			'<tr class="dg-scorecard-hole-number"> <!-- Hole number -->';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-28">28</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-29">29</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-30">30</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-31">31</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-32">32</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-33">33</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-34">34</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-35">35</th>';
		dg_display_markup +=				'<th class="dg-scorecard-hole-number-36">36</th>';
		dg_display_markup +=			'</tr>';
		dg_display_markup +=		'</thead>';
		dg_display_markup +=		'<tbody>';
		dg_display_markup +=			'<tr class="dg-scorecard-hole-par"> <!-- Hole par -->';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-28"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-29"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-30"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-31"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-32"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-33"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-34"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-35"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-relative-par-36"></td>';
		dg_display_markup +=			'</tr>';
		dg_display_markup +=			'<tr class="dg-scorecard-hole-score"> <!-- Hole score -->';
		dg_display_markup +=				'<td class="dg-scorecard-score-28"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-29"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-30"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-31"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-32"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-33"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-34"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-35"></td>';
		dg_display_markup +=				'<td class="dg-scorecard-score-36"></td>';
		dg_display_markup +=			'</tr>';
		dg_display_markup +=		'</tbody>';
		dg_display_markup +=	'</table>';
		dg_display_markup += '</div>';
	
		dg_scorecard_page_element.insertAdjacentHTML('beforeend', dg_display_markup);
	} // end for
}

/**
  Description: Populates the final scorecard with scores and styles parts based on relative par.
  @param {playerid} The player's id.
  @return	none
*/
function dg_show_player_scorecard(playerid){
	var scorecard_containers = document.getElementById('dg-scorecard-container').getElementsByClassName('dg-scorecard-player-container');
	var scorecard_player_container = '';
	var relative_par;
	var score_part = 0;
	
	for(var x = 0; x < scorecard_containers.length; x++){ // Cycle through players to find the correct container.
		if (playerid == scorecard_containers[x].getAttribute('data-playerid')){
			scorecard_player_container = scorecard_containers[x];
		}
	}
	// Display player name and total score.
	scorecard_player_container.getElementsByClassName('dg-scorecard-player-name')[0].innerHTML = dg_scorecard[playerid][0];
	scorecard_player_container.getElementsByClassName('dg-scorecard-score-total')[0].innerHTML = dg_get_score_total_formatted(playerid);
	// Display scorecard for the player.
	for(var hole = 1; hole <= 36; hole++){
		// Display par for each individual hole.
		if (dg_scorecard[0][hole] != undefined){
			scorecard_player_container.getElementsByClassName('dg-scorecard-relative-par-' + hole)[0].innerHTML = dg_scorecard[0][hole];
		} else {
			scorecard_player_container.getElementsByClassName('dg-scorecard-relative-par-' + hole)[0].innerHTML = 'x';
		}
		
		if (dg_scorecard[playerid][hole] != undefined && parseInt(dg_scorecard[playerid][hole]) != 0){
			scorecard_player_container.getElementsByClassName('dg-scorecard-score-' + hole)[0].innerHTML = dg_scorecard[playerid][hole];

			// Set background color for table columns. (See outside if statement for <th> color reset.)
			relative_par = parseInt(dg_scorecard[playerid][hole]) - parseInt(dg_scorecard[0][hole]);
			if (relative_par < 0){
				scorecard_player_container.getElementsByClassName('dg-hole-' + hole)[0].classList.add('dg-scorecard-hole-under-par');
			} else if (relative_par > 0){
				scorecard_player_container.getElementsByClassName('dg-hole-' + hole)[0].classList.add('dg-scorecard-hole-over-par');
			} else if (relative_par == 0) {
				scorecard_player_container.getElementsByClassName('dg-hole-' + hole)[0].classList.add('dg-scorecard-hole-on-par');
			}
		} else {
			scorecard_player_container.getElementsByClassName('dg-scorecard-score-' + hole)[0].innerHTML = 'x';
			scorecard_player_container.getElementsByClassName('dg-hole-' + hole)[0].classList.add('dg-scorecard-hole-not-played');
		}
		// Reset background color for heading with hole number.
		scorecard_player_container.getElementsByClassName('dg-scorecard-hole-number-' + hole)[0].classList.add('dg-scorecard-hole-heading');
	}
	// Display only the parts of the scorecard that were played.
	// 1-9
	score_part = 0;
	for (var x = 1; x <= 9; x++) {
		if (Number.isInteger(parseInt(dg_scorecard[playerid][x]))) {
			score_part += parseInt(dg_scorecard[playerid][x]);
		}
	}
	if (score_part > 0) {
		scorecard_player_container.getElementsByClassName('dg-scorecard-holes-1-9')[0].style.display = 'table';
	}
	// 10-18
	score_part = 0;
	for (var x = 10; x <= 18; x++) {
		if (Number.isInteger(parseInt(dg_scorecard[playerid][x]))) {
			score_part += parseInt(dg_scorecard[playerid][x]);
		}
	}
	if (score_part > 0) {
		scorecard_player_container.getElementsByClassName('dg-scorecard-holes-10-18')[0].style.display = 'table';
	}
	// 19-27
	var score_part = 0;
	for (var x = 19; x <= 27; x++) {
		if (Number.isInteger(parseInt(dg_scorecard[playerid][x]))) {
			score_part += parseInt(dg_scorecard[playerid][x]);
		}
	}
	if (score_part > 0) {
		scorecard_player_container.getElementsByClassName('dg-scorecard-holes-19-27')[0].style.display = 'table';
	}
	// 28-36
	var score_part = 0;
	for (var x = 28; x <= 36; x++) {
	if (Number.isInteger(parseInt(dg_scorecard[playerid][x]))) {
			score_part += parseInt(dg_scorecard[playerid][x]);
		}
	}
	if (score_part > 0) {
		scorecard_player_container.getElementsByClassName('dg-scorecard-holes-28-36')[0].style.display = 'table';
	}
}