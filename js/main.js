jQuery(function($) {
	const $gameField = $('#gamefield');

	const settings = {
		'levelData': false,
		'wordsPerGame': 20,
	};

	$('body').on('click', '.btn__action', function() {
		$.ajaxSetup({ async: false });

		const action = $( this ).data('action');

		if ( 'choose_lvl' === action ) {
			const lvlSlug = $( this ).data('lvl');
			const lvlName = $( this ).text();
			let words = {};

			settings.levelData = {
				"levelSlug": lvlSlug,
				"levelName": lvlName,
			};

			$.getJSON( './json/' + lvlSlug + '.json', function( data ) {
				words = data;
			});

			prepareLevelData(words);
			prepareLevelHTML();
		} else if ( 'choose_answer' === action ) {
			const isCorrect = $( this ).data('correct');

			if ( isCorrect ) correctAnswer();
			else wrongAnswer();
		} else if ( 'generate_json_data' === action ) {
			generateJSONData();
		} else if ( 'show_settings' === action ) {
			const $settings = $('.settings');

			$settings.toggleClass('settings_show');
		} else if ( 'change_settings' === action ) {
			let name = '';
			let value = '';

			if ( $( this ).hasClass('radio__wrap') ) {
				const $input = $( this ).find('input');
				name = $input.attr('name');
				value = $input.val();
			} else {
				name = $( this ).attr('name');
				value = $( this ).val();
			}

			changeSettings(name, value);
		}
	});

	init();

	function init() {
		const $tmpLevels = $('#template_choose-level');

		const $levels = $tmpLevels.contents().clone();
		$gameField.html( $levels );

		const wordsPerGame = settings.wordsPerGame;
		$('.settings').find('input[name=wordsPerGame][value=' + wordsPerGame + ']').prop('checked', true);
	}

	function prepareLevelData(words) {
		const wordsTotNum = Object.keys(words).length;
		const wordsPerGame = settings.wordsPerGame > 0 && settings.wordsPerGame <= wordsTotNum ? settings.wordsPerGame : wordsTotNum;

		settings.levelData.words = {};
		settings.levelData.options = {};

		for (let i = 0; i < wordsPerGame; i++) {
			const keys = Object.keys(words);
			const length = keys.length;

			const randomNumber = Math.floor(Math.random() * length);
			const key = keys[randomNumber];
			const wordData = words[key];

			delete words[key];

			settings.levelData.words[key] = wordData.he;
			settings.levelData.options[key] = wordData.ru;
		}

		if (Object.keys(words).length > 0) {
			const extraOptionsNum = wordsPerGame * 3;

			for (let i = 0; i < extraOptionsNum; i++) {
				const keys = Object.keys(words);
				const length = keys.length;

				if (length === 0) break;

				const randomNumber = Math.floor(Math.random() * length);
				const key = keys[randomNumber];
				const wordData = words[key];

				delete words[key];

				settings.levelData.options[key] = wordData.ru;
			}
		}
	}

	function prepareLevelHTML() {
		const $tmp1f4Header = $('#template__1from4_header');
		const wordsTotNum = Object.keys(settings.levelData.words).length;
		const wordsPerGame = settings.wordsPerGame > 0 && settings.wordsPerGame <= wordsTotNum ? settings.wordsPerGame : wordsTotNum;
		const lvlName = settings.levelData.levelName;

		const $1f4Header = $tmp1f4Header.contents().clone();
		$1f4Header.find('.gamefield__lvl-name').text(lvlName);
		$1f4Header.find('.gamefield__word-num_cur').text('1');
		$1f4Header.find('.gamefield__word-num_tot').text(wordsPerGame);

		$gameField.html('');
		$gameField.append($1f4Header);

		setWordHTML();
	}

	function correctAnswer() {
		const $curNum = $gameField.find('.gamefield__word-num_cur');
		const $totNum = $gameField.find('.gamefield__word-num_tot');
		const totNum = parseInt( $totNum.text() );
		let curNum = parseInt( $curNum.text() );

		const $statisticsForm = $gameField.find('.gamefield__header .gamefield__form-statistics');
		let corNum = parseInt( $statisticsForm.find('[name=correct]').val() );
		corNum++;
		$statisticsForm.find('[name=correct]').val(corNum);

		$('body').removeClass('choice_wrong choice_animate').addClass('choice_right');
		void $('body')[0].offsetWidth; // just for magic
		$('body').addClass('choice_animate');

		if ( curNum == totNum ) {
			showGameResult();

			return;
		}

		curNum++;
		$curNum.text(curNum);

		setWordHTML();
	}

	function wrongAnswer() {
		const $statisticsForm = $gameField.find('.gamefield__header .gamefield__form-statistics');
		let wrongNum = parseInt( $statisticsForm.find('[name=wrong]').val() );
		wrongNum++;
		$statisticsForm.find('[name=wrong]').val(wrongNum);

		$('body').removeClass('choice_right choice_animate').addClass('choice_wrong');
		void $('body')[0].offsetWidth; // just for magic
		$('body').addClass('choice_animate');
	}

	function setWordHTML() {
		const $tmp1f4Body = $('#template__1from4_body');
		const lvlData = JSON.parse(JSON.stringify(settings.levelData));

		let keys = Object.keys(lvlData.words);
		let length = keys.length;
		let randomNumber = Math.floor(Math.random() * length);
		let key = keys[randomNumber];

		const word = lvlData.words[key];
		const correct = Math.floor(Math.random() * 4);
		const options = [];

		delete settings.levelData.words[key];

		options[correct] = lvlData.options[key];

		delete lvlData.options[key];

		for (let i = 0; i < 4; i++) {
			if ( correct == i ) continue;

			let keys = Object.keys(lvlData.options);
			let length = keys.length;
			let randomNumber = Math.floor(Math.random() * length);
			let key = keys[randomNumber];

			options[i] = lvlData.options[key];

			delete lvlData.options[key];
		}

		const $1f4Body = $tmp1f4Body.contents().clone();
		$1f4Body.find('.gamefield__word').text(word);
		$1f4Body.find('.gamefield__option').each(function(index){
			$(this).text(options[index]);

			const isCorrect = correct == index;
			$(this).data('correct', isCorrect);
		});

		if ( $gameField.find('.gamefield__body').length > 0 ) $gameField.find('.gamefield__body').remove();

		$gameField.append($1f4Body);
	}

	function showGameResult() {
		const $tmp1f4Results = $('#template__1from4_results');
		const $tmp1f4Statistic = $('#template__1from4_result-statistic');
		const $1f4Results = $tmp1f4Results.contents().clone();
		const $statistics = $1f4Results.find('.gamefield__statistics');

		const $statisticsForm = $gameField.find('.gamefield__header .gamefield__form-statistics');
		const statisticsDataKeys = ['correct', 'wrong'];

		$.each(statisticsDataKeys, function(key, name) {
			const statVal = parseInt( $statisticsForm.find('[name=' + name + ']').val() );
			const $statistic = $tmp1f4Statistic.contents().clone();
			$statistic.find('.gamefield__statistic-title').text(name);
			$statistic.find('.gamefield__statistic-value').text(statVal);

			$statistics.append($statistic);
		});

		$gameField.find('.gamefield__body').remove();

		$gameField.append($1f4Results);
	}

	function changeSettings(name, value) {
		settings[name] = value;
	}

	// generate json

	function generateJSONData() {
		const $dataSource = $('#json-data');
		const data = $dataSource.val().split("\n");
		const json = {};

		$.each(data, function(index, value) {
			const line = value.split("	");

			const ru = line[0];
			const he = line[1];
			const key = transliteration(ru);

			json[key] = {
				ru,
				he
			};
		});

		$dataSource.val(JSON.stringify(json));
	}

	function transliteration(word) {
		const map = [
			["??", "a"], ["????", "a"], ["??", "a"], ["????", "a"], ["??", "ae"], ["????", "a"], ["????", "a"],
			["??", "a"], ["??", "a"], ["??", "a"], ["??", "a"], ["??", "a"], ["??", "b"], ["??", "v"],
			["??", "g"], ["??", "g"], ["??", "g"], ["??", "g"], ["??", "g"], ["??", "h"], ["??", "d"],
			["??", "d"], ["??", "e"], ["??", "e"], ["??", "e"], ["??", "e"], ["??", "e"], ["??", "e"],
			["??", "zh"], ["??", "zh"], ["??", "zh"], ["??", "zh"], ["??", "z"], ["??", "z"], ["??", "z"],
			["??", "z"], ["??", "j"], ["????", "i"], ["??", "i"], ["??", "i"], ["??", "ji"], ["????", "i"],
			["??", "i"], ["??", "j"], ["????", "j"], ["??", "j"], ["??", "k"], ["??", "k"], ["??", "k"],
			["??", "k"], ["??", "k"], ["??", "k"], ["????", "k"], ["??", "k"], ["??", "q"], ["??", "l"],
			["?????", "l"], ["??", "l"], ["??", "l"], ["??", "m"], ["??", "n"], ["??", "n"], ["??", "n"],
			["??", "n"], ["??", "n"], ["??", "n"], ["??", "n"], ["????", "n"], ["??", "n"], ["??", "o"],
			["??", "o"], ["??", "o"], ["??????", "o"], ["??", "o"], ["????", "o"], ["????", "o"], ["??", "o"],
			["??", "oe"], ["??", "p"], ["??", "p"], ["??", "p"], ["??", "r"], ["????", "s"], ["??", "s"],
			["??", "sh"], ["??", "sch"], ["??", "s"], ["??", "t"], ["????", "t"], ["??", "t"], ["??", "t"],
			["??", "u"], ["??", "u"], ["??", "u"], ["??", "u"], ["????", "u"], ["????", "u"], ["??", "u"],
			["??", "u"], ["????", "u"], ["????", "u"], ["??", "u"], ["??", "u"], ["??", "w"], ["??", "f"],
			["??", "f"], ["??", "h"], ["??", "h"], ["??", "c"], ["??", "c"], ["??", "d"], ["??", "ch"],
			["??", "ch"], ["??", "ch"], ["??", "ch"], ["??", "ch"], ["????", "ch"], ["??", "c"], ["??", "c"],
			["??", "c"], ["??", "y"], ["??", "y"], ["????", "y"], ["??", "y"], ["??", "y"], ["??", "y"],
			["", ""], ["??", "a"], ["????", "a"], ["??", "a"], ["????", "a"], ["??", "ae"], ["????", "a"],
			["????", "a"], ["??", "a"], ["??", "a"], ["??", "a"], ["??", "a"], ["??", "a"], ["??", "b"],
			["??", "v"], ["??", "g"], ["??", "g"], ["??", "g"], ["??", "g"], ["??", "g"], ["??", "h"],
			["??", "d"], ["??", "d"], ["??", "e"], ["??", "e"], ["??", "e"], ["??", "e"], ["??", "e"],
			["??", "e"], ["??", "zh"], ["??", "zh"], ["??", "zh"], ["??", "zh"], ["??", "z"], ["??", "z"],
			["??", "z"], ["??", "z"], ["??", "j"], ["????", "i"], ["??", "i"], ["??", "i"], ["??", "ji"],
			["????", "i"], ["??", "i"], ["??", "j"], ["????", "j"], ["??", "j"], ["??", "k"], ["??", "k"],
			["??", "k"], ["??", "k"], ["??", "k"], ["??", "k"], ["????", "k"], ["??", "k"], ["??", "q"],
			["??", "l"], ["?????", "l"], ["??", "l"], ["??", "l"], ["??", "m"], ["??", "n"], ["??", "n"],
			["??", "n"], ["??", "n"], ["??", "n"], ["??", "n"], ["??", "n"], ["????", "n"], ["??", "n"],
			["??", "o"], ["??", "o"], ["??", "o"], ["??????", "o"], ["??", "o"], ["????", "o"], ["????", "o"],
			["??", "o"], ["??", "oe"], ["??", "p"], ["??", "p"], ["??", "p"], ["??", "r"], ["????", "s"],
			["??", "s"], ["??", "sh"], ["??", "sch"], ["??", "s"], ["??", "t"], ["????", "t"], ["??", "t"],
			["??", "t"], ["??", "u"], ["??", "u"], ["??", "u"], ["??", "u"], ["????", "u"], ["????", "u"],
			["??", "u"], ["??", "u"], ["????", "u"], ["????", "u"], ["??", "u"], ["??", "u"], ["??", "w"],
			["??", "f"], ["??", "f"], ["??", "h"], ["??", "h"], ["??", "c"], ["??", "c"], ["??", "d"],
			["??", "c"], ["??", "c"], ["??", "c"], ["??", "c"], ["??", "c"], ["????", "c"], ["??", "c"],
			["??", "c"], ["??", "c"], ["??", "y"], ["??", "y"], ["????", "y"], ["??", "y"], ["??", "y"],
			["??", "y"], ["???", ""], ["\'", ""], ["\"", ""], [";", ""], [":", ""], [",", ""],
			["\\.", ""], [">", ""], ["<", ""], ["\\?", ""], ["!", ""], ["@", ""], ["#", ""],
			["$", ""], ["%", ""], ["&", ""], ["^", ""], ["\\(", ""], ["\\)", ""], ["\\*", ""],
			["\\+", ""], ["~", ""], ["\\|", ""], ["\\{", ""], ["\\}", ""], ["\\[", ""], ["\\]", ""],
			["\\/", ""], ["`", ""], ["=", ""], ["_", ""], ["\\s", ""], ["\\s\\s", ""],
			["/[^A-Za-z0-9\-]", ""]
		];

		for(let i=0; i<map.length; i++){
			word = word.replace(new RegExp(map[i][0], "g"), map[i][1]);
		};

		return word.trim();
	}
})