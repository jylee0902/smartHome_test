// up/down swiping을 감지하기 위한 jQuery Plug-in
(function($) {
	$.fn.tactile = function(swipe) {
		return this.each(function() {
			var $this = $(document),
				isTouching = false,
				debut;                                // means start in french

			$this.on('touchstart', debutGeste);

			function debutGeste() {               // means start of gesture
				if (event.touches.length == 1) {
					debut = event.touches[0].pageY;
					isTouching = true;
					$this.on('touchmove', geste);
				}
			}

			function finGeste() {                 // means end of gesture
				$this.off('touchmove');
				isTouching = false;
				debut = null;
			}

			function geste() {                   // geste means gesture
				if(isTouching) {
					var actuel = event.touches[0].pageY,
						delta = debut - actuel;

					if (Math.abs(delta) >= 30) {     // this '30' is the length of the swipe
						if (delta > 0) {
							swipe.up();
						} else {
							swipe.down();
						}
						finGeste();
					}
				}
				event.preventDefault();
			}
		});
	};
})(jQuery);

var Showroom = (function($, U) {
	"use strict";

	var utils = {
		doc: document,
		getElementById: function(id) {
			return this.doc.getElementById(id);
		},
		getLazily: function(obj, prop, init) {
			return obj[prop] || (obj[prop] = init());
		},
		rewriteHash: function(hash) {
			/*
			 * IE10+만 이 함수를 지원함
			 * IE9 이하는 transition을 지원하지 않으므로, location.hash를 바로 적용해도 문제가 없음
			 * */
			hash = '#' + hash;

			if (history.pushState) {
				history.pushState(null, null, hash);
			} else {
				location.hash = hash;
			}

			return this;
		},
		/*suspend: function(delay, fn) {
			if (!fn) {
				fn = delay;
				delay = 0;
			}

			if (delay > 0) {
				setTimeout(fn, delay);
			} else {
				fn();
			}

			return this;
		},*/
		translate: function(immediately, $el, translater) {
			if (immediately !== undefined && typeof immediately !== 'boolean') {
				translater = $el;
				$el = immediately;
				immediately = false;
			}

			if (immediately) {
				$el.addClass('no-transition');
			}

			translater($el);

			if (immediately) {
				$el.removeClass('no-transition');
			}

			return this;
		}
	};

	var service = {
		CARD_NAMES: ['intro', 'status', 'mode', 'security'],
		cards: {},
		config: {
			GNB_HOLDER_HEIGHT: 90,
			MODE_BACKGROUND_CHANGE_TIME1: 4,
			MODE_BACKGROUND_CHANGE_TIME2: 13.5,
			MODE_BACKGROUND_CHANGE_TIME3: 19.2,
			MODE_BACKGROUND_CHANGE_DURATION1: 1200,
			MODE_BACKGROUND_CHANGE_DURATION2: 700,
			MODE_WATCH_INTERVAL: 100,
			PHONE_HOLDER_OUTER_HEIGHT: 848,
			PHONE_HOLDER_OUTER_HEIGHT_MAX: 848,
			PHONE_HOLDER_OUTER_HEIGHT_MIN: 648,
			PHONE_HOLDER_OUTER_WIDTH: 460,
			PHONE_HOLDER_PADDING_BOTTOM: 211,
			PHONE_HOLDER_PADDING_LEFT: 28,
			PHONE_HOLDER_PADDING_RIGHT: 138,
			PHONE_HOLDER_PADDING_TOP: 117,
			PHONE_HOLDER_TOP_GAP: 39,
			SHOW_DELAY: 1000,
			TEXT_SHOW_BEGIN_POSITION: '150%',
			TEXT_SHOW_DELAY: 1400,
			TITLE_SHOW_BEGIN_POSITION: '150%',
			TITLE_SHOW_DELAY: 1100,
			WINDOW_HEIGHT_INFLECTION_MIN: 650,
			WINDOW_HEIGHT_INFLECTION_MAX: 900
		},
		state: {
			phoneHolderOuterHeight: 848,
			phoneHolderOuterWidth: 460,
			phoneHolderPaddingBottom: 211,
			phoneHolderPaddingLeft: 28,
			phoneHolderPaddingRight: 138,
			phoneHolderPaddingTop: 117,
			phoneHolderTopGap: 39,
			phoneHolderTop: 89,
			seized: false,
			windowHeight: $(window).height()
		},
		findFollowedCard: function(current, up) {
			var i = $.inArray(current, this.CARD_NAMES);
			return this.CARD_NAMES[up ? Math.max(--i, 0) : Math.min(++i, this.CARD_NAMES.length - 1)];
		},
		getBody: function() {
			return utils.getLazily(this, '$body', function() {
				return $(utils.doc.body);
			});
		},
		getCard: function(i) {
			return this.CARD_NAMES[i];
		},
		getCurrentCard: function() {
			return this.getBody().attr('data-card');
		},
		getDocument: function() {
			return utils.getLazily(this, '$doc', function() {
				return $(utils.doc);
			});
		},
		/*getEpilogue: function() {
			return utils.getLazily(this, '$epilogue', function() {
				return $(utils.getElementById('epilogue'));
			});
		},*/
		getGnbHolder: function() {
			return utils.getLazily(this, '$gnb', function() {
				return $(utils.getElementById('gnb-holder'));
			});
		},
		getMain: function() {
			return utils.getLazily(this, '$main', function() {
				return $(utils.getElementById('main'));
			});
		},
		getPager: function() {
			return utils.getLazily(this, '$pager', function() {
				return $(utils.getElementById('pager'));
			});
		},
		getPrologue: function() {
			return utils.getLazily(this, '$prologue', function() {
				return $(utils.getElementById('prologue'));
			});
		},
		getWindow: function() {
			return utils.getLazily(this, '$win', function() {
				return $(window);
			});
		},
		hasEvent: function() {
			return this.getBody().hasClass('has-event');
		},
		hideEvent: function() {
			this.getBody().addClass('hide-event');
			return this;
		},
		isSeized: function() {
			return this.state.seized;
		},
		opacifyGnb: function(f) {
			if (f === false) {
				this.getGnbHolder().removeClass('gnb-opacity');
			} else {
				this.getGnbHolder().addClass('gnb-opacity');
			}
		},
		seize: function(f) {
			this.state.seized = (f !== false);
			return this;
		},
		setCurrentCard: function(card) {
			this.getBody().attr('data-card', card || this.getCard(0));
			utils.rewriteHash(card);
			return this;
		},
		showEvent: function() {
			this.getBody().removeClass('hide-event');
			return this;
		}
	};

	function Watch(owner, interval, handler) {
		this.owner = owner;
		this.timer = null;
		this.interval = interval;
		this.handler = handler;
	}

	Watch.createWatch = function(owner, interval, handler) {
		return new Watch(owner, interval, handler);
	};

	Watch.prototype.start = function() {
		var that = this;

		this.stop().timer = setInterval(function() {
			that.handler(that.owner);
		}, this.interval);

		return this;
	};

	Watch.prototype.stop = function() {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}

		return this;
	};

	function Video(el) {
		this.el = el;
		this.$el = $(el);
		this.$parent = this.$el.parent();
		this.loadTimer = null;
	}

	Video.SAFE_PLAY_CHECK_INTERVAL = 50;

	Video.createVideo = function(el) {
		var video = new Video(el);

		$(video.el).off('ended').on('ended', function() {
			video.play();
		});

		return video;
	};

	Video.prototype.play = function() {
		var that = this;

		this.resetTimer();

		// canplay가 발생하지 않는 경우가 있어서 수동으로 확인
		if (!this._play()) {
			that.laodTimer = setInterval(function() {
				if (that._play()) {
					that.resetTimer();
				}
			}, Video.SAFE_PLAY_CHECK_INTERVAL);
		}

		return this;
	};

	Video.prototype.resetTimer = function() {
		if (this.loadTimer) {
			clearInterval(this.loadTimer);
			this.loadTimer = null;
		}
	};

	Video.prototype._play = function() {
		if (this.isReady()) {
			this.el.play();
			return true;
		}

		return false;
	};

	Video.prototype.pause = function(reset) {

		this.resetTimer();

		if (!this.isReady() || this.isPaused()) {
			return this;
		}

		this.el.pause();

		if (reset) {
			this.setCurrentTime(0);
		}

		return this;
	};

	Video.prototype.getCurrentTime = function() {
		return this.el.currentTime;
	};

	Video.prototype.setCurrentTime = function(t) {
		this.el.currentTime = t;
		return this;
	};

	Video.prototype.setSize = function(size) {
		size = size || U.calcFitSizeKeepingAspect(this.$parent.width(), this.$parent.height(), this.getAspect());
		this.$el.width(size.width).height(size.height);
		return this;
	};

	Video.prototype.getAspect = function() {
		return this.el.videoHeight ? this.el.videoWidth / this.el.videoHeight : -1;
	};

	Video.prototype.isReady = function() {
		return this.el.readyState === 4;
	};

	Video.prototype.isPaused = function() {
		return this.el.paused;
	};

	function Card(id) {
		this.id = id;
		this.el = utils.getElementById(id);
		this.$el = $(this.el);
		this.$phoneHolder = null;
		this.video = null;
		this.$title = null;
		this.$text = null;
		this.$background = null;
	}

	Card.prototype.resize = function() {
		// DO NOTHING : to be overridden
		return this;
	};

	Card.prototype.play = function(textShow) {
		service.opacifyGnb(false);

		this.resize();

		if (this.$title && this.$text) {
			this._displayDescription(!textShow);
		}

		return this;
	};

	Card.prototype.resume = function() {
		this._playPhone(true);
		this._playBackground(true);
		return this;
	};

	Card.prototype.pause = function(reset) {
		this._pausePhone(reset);
		this._pauseBackground(reset);
		return this;
	};

	Card.prototype._playPhone = function() {
		if (this.video) {
			this.video.play();
		}

		return this;
	};

	Card.prototype._pausePhone = function(reset) {
		if (this.video) {
			this.video.pause(reset);
		}

		return this;
	};

	Card.prototype._playBackground = function(/*resume*/) {
		// DO NOTHING : to be overridden
		return this;
	};

	Card.prototype._pauseBackground = function(/*reset*/) {
		// DO NOTHING : to be overridden
		return this;
	};

	Card.prototype._displayDescription = function(immediately) {
		var $title = this.$title, $text = this.$text;

		if (!this.$title || !this.$text) {
			return this;
		}

		if (!immediately) {
			utils.translate(true, $title, function($target) {
				$target.css({visibility: 'hidden', top: service.config.TITLE_SHOW_BEGIN_POSITION});
			}).translate(true, $text, function($target) {
				$target.css({visibility: 'hidden', top: service.config.TEXT_SHOW_BEGIN_POSITION});
			});
		}

		utils.translate(immediately, $title, function($target) {
			$target.css({visibility: 'visible'}).animate({top: '50%'}, service.config.TITLE_SHOW_DELAY);
		}).translate(immediately, $text, function($target) {
			$target.css({visibility: 'visible'}).animate({top: '50%'}, service.config.TEXT_SHOW_DELAY);
		});

		return this;
	};

	Card.createCard = function(id) {
		var card = new Card(id);

		card.$el.on('showbegin', function() {
			card._playPhone();
			card._playBackground();
		}).on('showend', function() {
			card.pause(true);
		});

		return card;
	};

	Card.fillPropertiesForMainCard = function(card) {
		card.$phoneHolder = card.$el.find('.phone-holder');
		card.video = Video.createVideo(card.$phoneHolder.find('video').get(0));
		card.$title = card.$el.find('.title');
		card.$text = card.$el.find('.text');
		card.$background = card.$el.find('.background-holder');

		card.play = function(textShow) {
			this._repositionPhoneHolder();
			return Card.prototype.play.call(this, textShow);
		};

		card.resize = function() {
			if (service.getCurrentCard() === this.id) {
				this._resizePhoneHolder();
				this._repositionPhoneHolder(true);
			}

			return this._resizeMainCard();
		};

		card._resizePhoneHolder = function() {
			var state = service.state;
			this.$phoneHolder.css({
				height: state.phoneHolderOuterHeight,
				width: state.phoneHolderOuterWidth,
				paddingBottom: state.phoneHolderPaddingBottom,
				paddingLeft: state.phoneHolderPaddingLeft,
				paddingRight: state.phoneHolderPaddingRight,
				paddingTop: state.phoneHolderPaddingTop
			});
			this.video.setSize();
		};

		card._repositionPhoneHolder = function(/*immediately*/) {
			// DO NOTHING : to be overridden
			return this;
		};

		card._resizeMainCard = function() {
			// DO NOTHING : to be overridden
			return this;
		};

		return card;
	};

	Card.fillPropertiesAndMethodsForStatusCard = function(card) {
		card.backgroundVideo = Video.createVideo(utils.getElementById('video-background'));

		card._playBackground = function() {
			this.backgroundVideo.play();
			return this;
		};

		card._pauseBackground = function(reset) {
			this.backgroundVideo.pause(reset);
			return this;
		};

		card._repositionPhoneHolder = function(immediately) {
			var top = service.state.phoneHolderTop, outerHeight = service.state.windowHeight;

			utils.translate(immediately, this.$phoneHolder, function($target) {
				$target.css({top: top});
			}).translate(immediately, service.cards.mode.$phoneHolder, function($target) {
				$target.css({top: top - outerHeight});
			});

			return this;
		};

		card._resizeMainCard = function() {
			return this._resizeBackgroundVideo();
		};

		card._resizeBackgroundVideo = function() {
			this.backgroundVideo.setSize();
			return this;
		};

		return card;
	};

	Card.fillPropertiesAndMethodsForModeCard = function(card) {
		card.watcher = Watch.createWatch(card, service.config.MODE_WATCH_INTERVAL, function() {
			this.changeBackground(this.calcNext());
		});

		card.watcher.currentBgIndex = 0;

		card.watcher.calcNext = function() {
			var video = this.owner.video, currentTime = 0;

			if (!video.isReady()) {
				return 0;
			} else if (video.isPaused()) {
				return this.currentBgIndex;
			} else {
				currentTime = video.getCurrentTime();

				if (currentTime < service.config.MODE_BACKGROUND_CHANGE_TIME1) {
					return 0;
				} else if (currentTime < service.config.MODE_BACKGROUND_CHANGE_TIME2) {
					return 1;
				} else if (currentTime < service.config.MODE_BACKGROUND_CHANGE_TIME3) {
					return 2;
				} else {
					return 0;
				}
			}
		};

		card.watcher.changeBackground = function(immediately, i) {
			if (immediately !== undefined && typeof immediately !== 'boolean') {
				i = immediately;
				immediately = false;
			}
			var that = this;

			if (i !== this.currentBgIndex) {
				that.currentBgIndex = i;
				this.switchBackground(immediately);
				service.opacifyGnb(i === 1);
			}

			return this;
		};

		card.watcher.switchBackground = function(immediately) {
			var owner = this.owner, current = this.currentBgIndex, prev = --current < 0 ? 2 : current;

			if (immediately) {
				owner.$background.find('.background-' + prev).prependTo(owner.$background).show();
				return this;
			}

			owner.$background.find('.background-' + prev).fadeOut(prev < 2 ? service.config.MODE_BACKGROUND_CHANGE_DURATION1 : service.config.MODE_BACKGROUND_CHANGE_DURATION2, function() {
				$(this).prependTo(owner.$background).show();
			});

			return this;
		};

		card._playBackground = function(resume) {
			this.watcher.start();

			if (!resume) {
				this.watcher.changeBackground(true, 0);
			}
			return this;
		};

		card._pauseBackground = function(reset) {
			this.watcher.stop();

			if (reset) {
				this._resetBackground();
			}
			return this;
		};

		card._resetBackground = function() {
			var $background0 = this.$background.find('.background-0').stop().css({opacity: 1}).remove(),
				$background1 = this.$background.find('.background-1').stop().css({opacity: 1}).remove(),
				$background2 = this.$background.find('.background-2').stop().css({opacity: 1}).remove();

			this.$background.append($background2).append($background1).append($background0);

			return this;
		};

		card._repositionPhoneHolder = function(immediately) {
			var top = service.state.phoneHolderTop, outerHeight = service.state.windowHeight;

			utils.translate(immediately, this.$phoneHolder, function($target) {
				$target.css({top: top});
			}).translate(immediately, service.cards.status.$phoneHolder, function($target) {
				$target.css({top: top + outerHeight});
			});

			return this;
		};

		return card;
	};

	Card.fillPropertiesAndMethodsForSecurityCard = function(card) {

		card.$securityNetwork = card.$el.find('.security-network');
		card.$securityService = card.$el.find('.security-service');

		card._playBackground = function() {
			var that = this, random = '?r=' + (new Date()).getTime(),
				securityNetworkBackgroundImage = this.$securityNetwork.css('background-image'),
				securityServiceBackgroundImage = this.$securityService.css('background-image');

			// showbegin을 받아서 바로 처리하면 너무 빠르다.
			setTimeout(function() {
				that.$securityNetwork.css({backgroundImage: 'url(' + securityNetworkBackgroundImage.match(/^url\((.*)\)$/)[1].split('?').shift().replace(/"/g, '') + random + ')'});
				that.$securityService.css({backgroundImage: 'url(' + securityServiceBackgroundImage.match(/^url\((.*)\)$/)[1].split('?').shift().replace(/"/g, '') + random + ')'});
			}, service.config.SHOW_DELAY);

		};

		return card;
	};



	function releaseSeizing($observer, leave) {
		$observer.off('transitionend').on('transitionend', function() {
			if (service.isSeized() && leave) {
				service.cards[leave].$el.trigger('showend');
			}
			service.seize(false);
		});
	}

	function triggerShowBeginAndEndEvent(enter, leave) {

		/**
		 * transitionend Event를 처리할 객체를 특정하기 곤란하여
		 * 안정성을 위해 유력한 후보 모두에서 처리한다.
		 * showend를 하는 것이므로 중복되도 무관하다.
		 */
		releaseSeizing(service.getPrologue(), leave);
		releaseSeizing(service.getMain(), leave);

		service.cards[enter].$el.trigger('showbegin');
	}

	function roll(enter, leave, textShow) {
		if (enter === leave) {
			service.seize(false);
			return;
		}

		service.setCurrentCard(enter);
		service.cards[enter].play(textShow);
		triggerShowBeginAndEndEvent(enter, leave);
	}

	function initService() {
		service.cards.intro = Card.createCard('intro');
		service.cards.status = Card.fillPropertiesAndMethodsForStatusCard(Card.fillPropertiesForMainCard(Card.createCard('status')));
		service.cards.mode = Card.fillPropertiesAndMethodsForModeCard(Card.fillPropertiesForMainCard(Card.createCard('mode')));
		service.cards.security = Card.fillPropertiesAndMethodsForSecurityCard(Card.createCard('security'));

		service.setCurrentCard(service.CARD_NAMES[0]);
	}

	function captureClickEventOnCommercialEventIfExists() {
		if (service.hasEvent()) {
			var $body = service.getBody();

			$body.find('#bt-event-badge').on('click', function() {
				service.showEvent();
			});

			$body.find('.bt-event-close').on('click', function() {
				service.hideEvent();
			});
		}
	}

	function captureWheelEvent() {
		service.getBody().on('wheel', function(ev) {
			if (!service.isSeized()) {
				service.seize();

				var leave = service.getCurrentCard(),
					up = (ev.originalEvent.deltaY || -ev.originalEvent.wheelDelta || 0) < 0;

				roll(service.findFollowedCard(leave, up), leave, !up);
			}

			return false;
		});

		service.getDocument().tactile({
			up: function() {
				if (!service.isSeized()) {
					service.seize();

					var currentCard = service.getCurrentCard();
					roll(service.findFollowedCard(currentCard), currentCard, true);
				}
			},
			down: function() {
				if (!service.isSeized()) {
					service.seize();

					var currentCard = service.getCurrentCard();
					roll(service.findFollowedCard(currentCard, true), currentCard);
				}
			}
		});
	}

	function captureClickEventOnPager() {
		service.getPager().on('click', function(ev) {
			if (!service.isSeized()) {
				var target = ev.target;

				if (target.tagName.toLowerCase() === 'a') {
					service.seize();
					roll(target.hash.substr(1), service.getCurrentCard());
				}
			}

			return false;
		});

		service.getPrologue().find('.bt-next-roller').on('click', function() {
			if (!service.isSeized()) {
				service.seize();
				roll(service.CARD_NAMES[1], service.CARD_NAMES[0], true);
			}
			return false;
		});
	}

	function captureHashChangeEvent() {
		service.getWindow().on('hashchange', function() {
			var current = service.getCurrentCard() || service.config.CARD_NAMES[0],
				followed = location.hash.split('#').pop();

			if (current && followed && current !== followed) {
				roll(followed, current);
			}
		});
	}

	function captureDialogEvent() {
		service.getWindow().on('dialogopen', function() {
			service.cards[service.getCurrentCard()].pause();
		}).on('dialogclose', function() {
			service.cards[service.getCurrentCard()].resume();
		});
	}

	function calcAndCacheSizeFactors() {
		var config = service.config, state = service.state, ratio;

		state.windowHeight = service.getWindow().height();

		if (state.windowHeight < config.WINDOW_HEIGHT_INFLECTION_MIN) {
			state.phoneHolderOuterHeight = config.PHONE_HOLDER_OUTER_HEIGHT_MIN;
		} else if (state.windowHeight > config.WINDOW_HEIGHT_INFLECTION_MAX) {
			state.phoneHolderOuterHeight = config.PHONE_HOLDER_OUTER_HEIGHT_MAX;
		} else {
			state.phoneHolderOuterHeight = (state.windowHeight - config.WINDOW_HEIGHT_INFLECTION_MIN) * (config.PHONE_HOLDER_OUTER_HEIGHT_MAX - config.PHONE_HOLDER_OUTER_HEIGHT_MIN) / (config.WINDOW_HEIGHT_INFLECTION_MAX - config.WINDOW_HEIGHT_INFLECTION_MIN) + config.PHONE_HOLDER_OUTER_HEIGHT_MIN;
		}

		ratio = state.phoneHolderOuterHeight / config.PHONE_HOLDER_OUTER_HEIGHT;

		state.phoneHolderOuterWidth = config.PHONE_HOLDER_OUTER_WIDTH * ratio;
		state.phoneHolderPaddingBottom = config.PHONE_HOLDER_PADDING_BOTTOM * ratio;
		state.phoneHolderPaddingLeft = config.PHONE_HOLDER_PADDING_LEFT * ratio;
		state.phoneHolderPaddingRight = config.PHONE_HOLDER_PADDING_RIGHT * ratio;
		state.phoneHolderPaddingTop = config.PHONE_HOLDER_PADDING_TOP * ratio;
		state.phoneHolderTopGap = config.PHONE_HOLDER_TOP_GAP * ratio;

		state.phoneHolderTop = Math.round(Math.max(config.GNB_HOLDER_HEIGHT - state.phoneHolderTopGap, (state.windowHeight - state.phoneHolderOuterHeight - state.phoneHolderPaddingTop + state.phoneHolderPaddingBottom) / 2));
	}

	return {
		init: function() {
			initService();

			captureClickEventOnCommercialEventIfExists();
			captureWheelEvent();
			captureClickEventOnPager();
			captureHashChangeEvent();
			captureDialogEvent();

			roll('intro');

			return this;
		},
		resize: function() {
			var cards = service.cards;

			calcAndCacheSizeFactors();
			cards.intro.resize();
			cards.status.resize();
			cards.mode.resize();
			cards.security.resize();

			return this;
		}
	};
})(jQuery, SmartHomeUI);