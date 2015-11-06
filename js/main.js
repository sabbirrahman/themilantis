(function(){
	// This code prevents users from dragging the page
	var preventDefaultScroll = function(event) {
		if(isInAbout) return;
		event.preventDefault();
		window.scroll(0,0);
		return false;
	};

	// Constants:
	var Screen_Width = parseInt(window.innerWidth);
	var Screen_Height = parseInt(window.innerHeight);


	// Elements:
	var mainContainer 	= document.getElementById("mainContainer");
	var menu 			= document.getElementById("menu");
	var game			= document.getElementById("game");
	var setting			= document.getElementById("setting");
	var about 			= document.getElementById("about");


	// Buttons:
	var settingsButton 	= document.getElementById("settingsButton");
	var saveSetting 	= document.getElementById("saveSetting");
	var aboutButton 	= document.getElementById("aboutButton");
	var backButtons		= document.getElementsByClassName("backButton");
	var showImageButton = document.getElementById("showImageButton");
	var playButton 		= document.getElementById("playButton");
	var resumeButton 	= document.getElementById("resumeButton");
	var restartButton   = document.getElementById("restartButton");
	var clearButton		= document.getElementById("clearButton");


	// The Block Class:
	var Block = function(element){
		this.block = element;
		this.serial = parseInt(this.block.className);
		Object.defineProperties(this, {
			left : {
				get : function() 	 { return this.block.style.left;  },
				set : function(value){ this.block.style.left = value; }
			},
			top : {
				get : function() 	 { return this.block.style.top;   },
				set : function(value){ this.block.style.top = value;  }
			}
		});
	}


	// The Setting Object:
	var settings = {
		difficulty 	: 1,
		imageUrl 	: "img/nfs.jpg",
		sound		: true,
		hints		: true
	};
	if(localStorage.settings == undefined){
		localStorage.settings = JSON.stringify(settings);
	} else {
		settings = JSON.parse(localStorage.settings);
	}

	// The Highscore Array:
	var highscore = [999999, 999999, 999999];
	if(localStorage.highscore == undefined){
		localStorage.highscore = JSON.stringify(highscore);
	} else {
		highscore = JSON.parse(localStorage.highscore);
	}


	// Misc Functions:
	var hide   = function(element) { element.style.display = "none" ; }
	var show   = function(element) { element.style.display = "block"; }
	var toggle = function(element) { element.style.display = (element.style.display == "block")? "none" : "block"; }
	var playSound = function(url, duration){
		if(!settings.sound) return;
		var sound  = document.createElement("audio");
		var source1 = document.createElement("source");
		source1.setAttribute("src", url+".mp3");
		source1.setAttribute("type", "audio/mpeg");
		var source2 = document.createElement("source");
		source2.setAttribute("src", url+".ogg");
		source2.setAttribute("type", "audio/ogg");
		mainContainer.appendChild(sound);
		sound.appendChild(source1);
		sound.appendChild(source2);
		sound.play();
		setTimeout(function(){
			//mainContainer.removeChild(sound);
		}, duration);
	}


	// Function for Splash Screen:
	var showSplash = function(){
		var logo = document.getElementById("logo");
		var logoSize = ((Screen_Width * 0.5)>250) ? 250 : (Screen_Width * 0.5);
		logo.style.width  = logoSize + "px";
		logo.style.height = logoSize + "px";
		logo.style.marginTop = ((Screen_Height/2) - (logoSize/2)) + "px";
		show(logo);
		setTimeout(function(){
			var splash = document.getElementById("splash");
			mainContainer.removeChild(splash);
			showMenu();
		}, 2500);
	}

	var dontShowSplash = function(){
		var splash = document.getElementById("splash");
		mainContainer.removeChild(splash);
		showMenu();
	}

	// Functions for Menu:
	var showMenu = function(){
		menu.style.marginTop = ((Screen_Height/2)-65) + "px";
		var logoSize = ((Screen_Width * 0.5)>250) ? 250 : (Screen_Width * 0.5);
		show(menu);
		hide(resumeButton);
		if((logoSize + 140) < Screen_Height){
			menu.style.marginTop = ((Screen_Height/2) - ((logoSize + 140)/2)) + "px";
			var logo = document.getElementById("logo");
			logo.style.width  = (Screen_Width * 0.5) + "px";
			logo.style.height = (Screen_Width * 0.5) + "px";
			show(logo);
		}
	}
	var isInAbout = false;
	var showAbout = function(){
		isInAbout = true;
		hide(menu);
		show(about);
	}
	var showSettings = function(){
		hide(menu);
		show(setting);
		setting.style.marginTop = ((Screen_Height/2) - 160) + "px";
		var difficultyButtons = document.getElementsByName("difficulty");
		var arr = [0, 1, 2];
		for(var i=0; i<3; i++){
			if(settings.difficulty == arr[i]){
				difficultyButtons[i].setAttribute("checked", ""); break;
			}
		}
		var imageButtons = document.getElementsByName("image");
		var arr = ["nfs", "cas", "art", "mvb"];
		for(var i=0; i<4; i++){
			if(settings.imageUrl == "img/" + arr[i] + ".jpg"){
				imageButtons[i].setAttribute("checked", ""); break;
			}
		}
		var hintsButton = document.getElementById("hints");
		var soundButton = document.getElementById("sound");
		if(settings.hints){ hintsButton.setAttribute("checked", ""); }
		if(settings.sound){ soundButton.setAttribute("checked", ""); }
	}
	var gotoMenu = function(event){
		if(event.target.parentNode == game) clearInterval(timer);
		hide(event.target.parentNode);
		show(menu);
		isInAbout = false;
	}


	// Functions for Settings:
	var saveSettings = function(){
		var difficultyButtons = document.getElementsByName("difficulty");
		for(var i=0; i<3; i++){
			if(difficultyButtons[i].checked){
				settings.difficulty = parseInt(difficultyButtons[i].value); break;
			}
		}
		var imageButtons = document.getElementsByName("image");
		for(var i=0; i<4; i++){
			if(imageButtons[i].checked){
				settings.imageUrl = "img/" + imageButtons[i].value + ".jpg"; break;
			}
		}
		var hintsButton = document.getElementById("hints");
		var soundButton = document.getElementById("sound");

		settings.sound  = (soundButton.checked) ? true : false;
		settings.hints  = (hintsButton.checked) ? true : false;

		localStorage.settings = JSON.stringify(settings);
		hide(setting);
		show(menu);
		clearGame();
	}

	var clearAll = function(){
		localStorage.clear();
		localStorage.restart = 1;
		window.location = "index.html";
	}


	// Variables for Gamplay:
	var MAX_ROW;
	var MAX_COL;
	var INC;
	var Blocks = [];
	var Blank;
	var timer;
	var sorted;

	// Elements of Gameplay:
	var main 	  = document.getElementById("wraper");
	var puzzleBox = document.getElementById("puzzleBox");
	var Move 	  = document.getElementById("move");
	var Time 	  = document.getElementById("time");
	var success   = document.getElementById("success");

	// Functions for Gameplay:
	var showScoreBoard = function(){
		timer = setInterval(function(){
			Time.innerHTML = parseInt(Time.innerHTML)+1+"s";
		}, 1000);
	}

	var showHighScore = function(){
		var showHighscore = document.getElementById("showHighscore");
		showHighscore.innerHTML = "Highscore: ";
		if(highscore[settings.difficulty] == 999999){
			showHighscore.innerHTML += "none";
		} else {
			showHighscore.innerHTML += highscore[settings.difficulty];
		}
	}

	var setDifficulty = function(){
			 if(settings.difficulty == 0 ) { MAX_ROW = 3; MAX_COL = 3; }
		else if(settings.difficulty == 1 ) { MAX_ROW = 4; MAX_COL = 4; }
		else if(settings.difficulty == 2 ) { MAX_ROW = 5; MAX_COL = 5; }
	}

	var createPuzzleBox = function(){
		main.style.width = (Screen_Width<Screen_Height) ? (Screen_Width * 0.95) + "px" : (Screen_Height * 0.80) + "px";
		puzzleBox.style.width  = (parseInt(main.style.width) - 20) + "px";
		puzzleBox.style.height = (parseInt(main.style.width) - 20) + "px";
		main.style.marginTop = ((Screen_Height/2) - (parseInt(puzzleBox.style.width)/2) - 65) + "px";
		INC	= Math.floor(parseInt(puzzleBox.style.width)/MAX_COL);
	}

	var createGrid = function(){
		var index = 1;
		for(var row = 0; row < MAX_ROW*INC; row += INC){
			for(var col = 0; col < MAX_COL*INC; col += INC){
				var sigleBlock = document.createElement("div");
				sigleBlock.setAttribute("id", "block"+index);
				sigleBlock.setAttribute("class", index-1);
				sigleBlock.style.background = "url(" + settings.imageUrl + ")";
				sigleBlock.style.backgroundPosition = (-1*col) + "px" + " " + (-1*row) + "px";
				sigleBlock.style.width  = INC + "px";
				sigleBlock.style.height = INC + "px";
				sigleBlock.style.lineHeight = INC + "px";
				if(settings.hints) sigleBlock.innerHTML = index;
				puzzleBox.appendChild(sigleBlock);
				Blocks[index-1] = new Block(sigleBlock);
				index++;
			}
		}
		Blank = Blocks[(MAX_COL*MAX_ROW)-1];
		Blank.block.style.background = "#F3F3F3";
		Blank.block.innerHTML = "";
		createImage();
	}

	var createImage = function(){
		var image = document.createElement("div");
		image.setAttribute("id", "showImage");
		image.setAttribute("class", "showImage");
		image.style.background = "url('" + settings.imageUrl + "')";
		image.style.width  = (parseInt(puzzleBox.style.width) - 2) + "px";
		image.style.height = (parseInt(puzzleBox.style.height) - 2) + "px";
		image.style.backgroundSize = puzzleBox.style.width + " " + puzzleBox.style.height;
		image.style.display = "none";
		puzzleBox.appendChild(image);
	}

	var showImage = function(){
		var image = document.getElementById("showImage");
		toggle(image);
	}

	// Using Fisher-Yates Shuffle Algorithm:
	var shuffle = function(){
		var len = Blocks.length - 1;
		for(var i=len; i>0; i--){
			var random = Math.floor(Math.random() * i);
			var temp = Blocks[i];
			Blocks[i] = Blocks[random];
			Blocks[random] = temp;
		}
		var index = 0;
		for(var row=0; row<MAX_ROW*INC; row+=INC){
			for(var col=0; col<MAX_COL*INC; col+=INC){
				Blocks[index].left = col + "px";
				Blocks[index].top = row + "px";
				Blocks[index].block.style.backgroundSize = (MAX_ROW * INC) + "px" + " " + (MAX_COL * INC) + "px";
				index++;
			}
		}
	}

	var isSorted = function(){
		var index = 0;
		for(var row = 0; row < MAX_ROW * INC; row += INC){
			for(var col = 0; col < MAX_COL * INC; col += INC){
				var element = new Block(document.getElementById("block"+(index+1)));
				if(!(element.serial == index && element.left == col+"px" && element.top == row+"px")){
					return false;
				}
				index++;
			}
		}
		return true;
	}

	var setHighScore = function(score){
		if(score < highscore[settings.difficulty]){
			highscore[settings.difficulty] = score;
			localStorage.highscore = JSON.stringify(highscore);
			showHighScore();
			return true;
		}
		return false;
	}

	var moveBlock = function(event){
		if(sorted) return;
		var Temp  = new Block(event.target);
		var leftT = Temp.left;
		var topT  = Temp.top;
		if((parseInt(leftT) == parseInt(Blank.left)) || (parseInt(topT) == parseInt(Blank.top))){
			if(Math.abs(parseInt(leftT) - parseInt(Blank.left)) == INC ||
			   Math.abs(parseInt(topT ) - parseInt(Blank.top )) == INC){
			   	playSound("sounds/moveSound", 1000);
				Temp.left 	= 	Blank.left;
				Temp.top 	= 	Blank.top;
				Blank.left 	= 	leftT;
				Blank.top 	= 	topT;
				Move.innerHTML = parseInt(Move.innerHTML)+1;
				if(isSorted(Blocks)){
					var score = parseInt(Time.innerHTML)+parseInt(Move.innerHTML);
					if(setHighScore(score)){
						success.innerHTML = "Congratulation!<br/>New Highscore!<br/>Score: " + score;
					} else {
						success.innerHTML = "Congratulation!<br/>Score: " + score;
					}
					clearInterval(timer);
					showImage();
					playSound("sounds/success", 2000)
					sorted = true;
					show(success);
				} else {
					hide(success);
				}
			}
		}
	}

	var hideSuccess = function(){
		hide(success);
	}

	var clearGame = function(){
		puzzleBox.innerHTML = "";
		hide(resumeButton);
		show(playButton);
	}

	var startGame = function(){
		sorted = false;
		Blocks = [];
		hide(menu);
		show(game);
		showHighScore();
		setDifficulty();
		createPuzzleBox();
		createGrid();
		shuffle();
		Move.innerHTML = 0;
		Time.innerHTML = 0+"s";
		showScoreBoard();
		hide(playButton);
		show(resumeButton);
	}

	var resumeGame = function(){
		if(!isSorted()){ showScoreBoard(); }
		hide(menu);
		show(game);
	}

	var restartGame = function(){
		sorted = false;
		hide(success);
		var image = document.getElementById("showImage");
		hide(image);
		shuffle();
		clearInterval(timer);
		Move.innerHTML = 0;
		Time.innerHTML = 0+"s";
		showScoreBoard();
	}


	// Event Listeners:
	settingsButton.addEventListener("click", showSettings, false);
	showImageButton.addEventListener("click", showImage, false);
	saveSetting.addEventListener("submit", saveSettings, false);
	aboutButton.addEventListener("click", showAbout, false);
	playButton.addEventListener("click", startGame, false);
	resumeButton.addEventListener("click", resumeGame, false);
	restartButton.addEventListener("click", restartGame, false);
	success.addEventListener("click", hideSuccess, false);
	puzzleBox.addEventListener("click", moveBlock, false);
	clearButton.addEventListener("click", clearAll, false);
	document.addEventListener('touchmove', preventDefaultScroll, false);
	for(var i=0; i<backButtons.length; i++){ backButtons[i].addEventListener("click", gotoMenu, false); }
	
	// Initiating:
	if(localStorage.restart === undefined){
		showSplash();
	} else {
		localStorage.removeItem("restart");
		dontShowSplash();
	}
})();