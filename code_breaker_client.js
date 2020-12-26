var NUM_BALLS = 8; //num of balls to choose from
var CODE_LENGTH = 5; //length of the code meant to be cracked
var NUM_ATTEMPTS = 8; //attempts allowed in a session
var MAX_NUM_ATTEMPTS = 8; //maximum number of attempts allowed

var peg_selected = 0;
var attempt_code;
var current_attempt_id;
var start = new Date();
var btn_initial_top;
var url = "localhost:3000";

var myName;

window.onload = function()
{
    createGameBoard(); //draw the game board
    
    //initial layout setup
    var step = parseInt($(".attempt").css("margin-top")) 
                + parseInt($(".attempt").css("height"));
    var attemptHeight = parseInt($(".attempt").css("height"));
    btn_initial_top = parseInt($("#acceptcode").css("top")) 
                      - (MAX_NUM_ATTEMPTS - NUM_ATTEMPTS) * step;
    
    //set game board height
    $("#gameboard").css("height", NUM_ATTEMPTS * step + attemptHeight+"px");
    
    //player will enter their name here
    myName = prompt("Please enter your name", "");
    $('#name').text(myName);
    
    initGameBoard();
    
    // start the timer
    setInterval(function() 
    {$("#timer").text(parseInt((new Date() - start) / 1000) + "s");}, 1000);
}

// Game board creation; one line to display code images, 8 blank attempts, 1 accept button and 8 selection pegs
function createGameBoard(){
    
    //add code images (dummy code)
    for (var i = 1; i <= CODE_LENGTH; i++){
        var newImg = document.createElement("img");
        $(newImg).attr("id", "code" + i);
        //add a dummy image
        $(newImg).attr("src", "./images/hole.png");
        $("#coderow").append(newImg);
    }
 
    //add attempts
    for (var i = NUM_ATTEMPTS; i > 0; i--){
        
		//for each attempt a div is created and ID and class are set appropriately
        var newDiv = document.createElement("div");
        $(newDiv).attr("id","attempt"+i);
        $(newDiv).attr("class","attempt");

		
		//a span is created within the div to house the 5 attempt images
        var newSpan = document.createElement("span");
        $(newSpan).attr("id","attempt"+i+"pegs");
        $(newDiv).attr("class","attemptpegs");


		//5 blank peg holes are added to the span
        for (var j = 1; j <= CODE_LENGTH; j++){
            var newImg = document.createElement("img");
            $(newImg).attr("id","attempt"+i+"_"+j);
            $(newImg).attr("class","imgAttempt");
            $(newImg).attr("src","./images/hole.png");
            $(newSpan).append(newImg);
        }
		//append the span to the div
        $(newDiv).append(newSpan);
        
        //create a new span for displaying result of the end-user attempt, set id and append it to the div
        var endSpan = document.createElement("span");
        $(endSpan).attr("id","attempt"+i+"result");
        $(newDiv).append(endSpan);

		//append each div to the game board		
		$("#gameboard").append(newDiv);
    }
   
    //add Accept button inside a <div>, and add it to the game board
    var newDiv = document.createElement("div");
    $(newDiv).attr("id", "acceptcode");
    var newInput = document.createElement("input");
    $(newInput).attr("type", "button");
    $(newInput).attr("name", "Accept");
    $(newInput).attr("value", "Accept");
    $(newInput).click(process_attempt);
    $(newDiv).append(newInput);
    $("#gameboard").append(newDiv);

    //add peg selection	by creating 8 img elements using the shadowed out pegs images
    for (var i = 1; i <= NUM_BALLS; i++){
        var newImg = document.createElement("img");
        $(newImg).attr("id","marble"+i);
        $(newImg).attr("class","marbleshadow");
        $(newImg).attr("src","./images/shadow_ball_"+i+".png");
        $(newImg).click({id: i}, select_peg); 
        $("#pegselection").append(newImg);
    }
    
}

// Initialize the game board; reset all choices and elements and request the server to generate a new code to crack
function initGameBoard(){
    //reset holes
    for (var i = NUM_ATTEMPTS; i > 0; i--){
        for (var j = 1; j <= CODE_LENGTH; j++){
            $("#attempt" + i + "_" + j).attr("src", "./images/hole.png");
            $("#attempt" + i + "_" + j).css({'opacity' : 0.3});
        }
        $("#attempt" + i + "result").empty();
    }
    
    //reset the button's position and visibility
    current_attempt_id = 0;
    var step = parseInt($(".attempt").css("margin-top")) 
	         + parseInt($(".attempt").css("height"));
    $("#acceptcode").css({'top' : btn_initial_top + 'px'});
    $("#acceptcode").css({'visibility' : 'visible'});
    
    // show the cover to hide code
    $("#cover").css({'visibility' : 'visible'});
    
    //send request to server to start a new game.
    $.post(url+'?data='+JSON.stringify({
                            'name':myName, 
                            'action':'generateCode'}),
           response);
}

// Start an attempt
function activateAttempt(id){
    //remove onclick event for all holes
    $(".imgAttempt").off("click");
    
    //reset the visibility of the current attempt, 
    //and add onclick event to the holes in this attempt
    for (var i = 1; i <= CODE_LENGTH; i++){
        $("#attempt"+id+"_"+i).css({'opacity' : 1});
        $("#attempt"+id+"_"+i).click({id: i}, process_hole);
    }
    
    current_attempt_id = id;
    
    //reset the attempt code array
    attempt_code = new Array(CODE_LENGTH).fill(0);
}

// OnClick event handler for holes
function process_hole(event){
    if (peg_selected != 0){ //display the selected ball on the hole
        $(this).attr("src", "./images/ball_" + peg_selected + ".png");
        attempt_code[event.data.id-1] = peg_selected;
    }else{ //no ball was selected
        alert("Please select the ball!")
    }
}

// OnClick event handler for the accept button
function process_attempt(){
    if (!attempt_code.includes(0)){ //move the button up and display the result
        var step = parseInt($(".attempt").css("margin-top")) 
        + parseInt($(".attempt").css("height"));
        
        $(this).parent().css({'top' : btn_initial_top 
                        - current_attempt_id * step + 'px'});

        //send the attempt_code to server for evaluation
        $.post(
            url+'?data='+JSON.stringify({
            'name':myName, 
            'action':'evaluate', 
            'attempt_code':attempt_code, 
            'current_attempt_id':current_attempt_id
            }),
            response
        );
        // hide the btn to wait for server's response
        $(this).parent().css({'visibility' : 'hidden'});
    }else{ //the attempt is not completed.
        alert("Please complete your attempt!");
    }
    
}

// Server response handler
function response(data, status){
    var response = JSON.parse(data);
    console.log(data);
    if (response['action'] == 'generateCode'){ //code generation
        
        myName = response['nameID'];
        activateAttempt(1); 
        peg_selected = 0;

        //reset the visibility of every shadow_balls
        for (var i = 1; i <= NUM_BALLS; i++){
            $("#shadow"+i).css({'opacity' : 1});
        }
        
        //reset timer
        start = new Date();
        
    } else if (response['action'] == 'evaluate'){ //evaluate user's code selection
        $("#acceptcode").css({'visibility' : 'visible'});
        
        //read data from the json object that send back from the server
        var win = response['win'];
        var num_match = response['num_match'];
        var num_containing = response['num_containing'];
        var num_not_in = response['num_not_in'];
        var code = response['code']
        
        //display the number of balls that match the code
        displayResult(num_match, "black");
        //display the number of balls in the code
        displayResult(num_containing, "white");
        //display the number of balls not in the code
        displayResult(num_not_in, "empty");
        
        if (current_attempt_id < NUM_ATTEMPTS && !win){ //continue game 
            current_attempt_id++;
            activateAttempt(current_attempt_id);
        } else { //end game; display result and hide button
            $("#acceptcode").css({'visibility' : 'hidden'});
            $("#cover").css({'visibility' : 'hidden'});
            displayCode(code);
            win? alert("GG! You win. Click enter to play again.")
            : alert("Uh Oh, Click enter to try again!");
            initGameBoard();
        }
    }
}

// Result display
function displayResult(num, color){
    while (num > 0){ //add result image
        var newImg = document.createElement("img");
        $(newImg).attr("src", "./images/"+color+"_peg.png");
        $("#attempt" + current_attempt_id + "result").append(newImg);
        num--;
    }
}

// Display the initial code after the game is complete
function displayCode(code){
    for (var i = 1; i <= CODE_LENGTH; i++){
        $("#code"+i).attr("src", "./images/ball_"+ code[i-1] +".png");
    }
}

// Handler for peg selection
function select_peg(event){
    peg_selected = event.data.id;
    for (var i = 1; i <= NUM_BALLS; i++){
        $("#shadow"+i).css({'opacity' : 0.45});
    }
    //increase the visibility of the selected ball
    $(this).css({'opacity' : 1});
}
