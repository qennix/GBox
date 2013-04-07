var SWOOP,
	SWEvent,
	SWLocation,
	SWFacilitator;

SWOOP = function () {
	var events = [],
		loaded = false,
		startNode = null,
		endNode = null,
		currentNode = null,
		total = 0,
		region = 'all',
		period = 'all',
		periodIndex = 0,
		regions = null,
		periodArray = null,
		signed = false,
		user = null, 
		token = null;

	return {
		init: function () {
			var self = this;
			$.getJSON('datasets/events.json', function (data) {
				var i, 
					newEvent;
				if (typeof data === 'object' && data.length) {
					loaded = true;
					for(i = 0; i < data.length; i += 1) {
						newEvent = new SWEvent(data[i]);
						events.push(newEvent);
					}
					self.preparePeriods();
					self.prepareRegions();
					self.prepareTimeLine();
					self.renderPage();
					self.showData();
				}	
			});
		},
		isInsertable: function (event) {
			var ok = true;
			ok &= (region === 'all' || region === event.region);
			ok &= (period === 'all' || period === event.period);
			return ok; 
		},
		prepareTimeLine: function () {
			var i, count = 0;
			startNode = null;
			endNode = null;
			for (i = 0; i < events.length; i += 1) {
				events[i].next = null;
				events[i].prev = null;
				if (this.isInsertable(events[i])) {
					this.insertOrderedNode(events[i]);
					count++;
				}
			}
			total = count;
		},
		prepareRegions: function () {
		    var i;
		    for (i = 0; i < events.length; i += 1) {
		    	events[i].region = this.getRegion(events[i].country);
		    }
		},
		getRegion: function (country) {
			if (!regions) {
				regions = this.loadRegions();
			}
			if (country == "USA") {
				country = 'United States';
			}
			if (country == 'UK') {
				country = 'United Kingdom';
			}
			if (regions[country]){
				return regions[country].Continent
			} else {
				return null;
			}	
		},
		loadRegions: function () {
			var regions = {}, i;
			for (i = 0; i < countries.length; i += 1) {
				regions[countries[i].Country] = countries[i];
			}
			return regions;
		},
		preparePeriods: function () {
			var i, minDate = null, maxDate = null;
			for (i = 0; i < events.length; i += 1) {
				if (!minDate) {
					minDate = new Date(events[i].start_date);
				}
				if (!maxDate) {
					maxDate = new Date(events[i].start_date);
				}
				if (new Date(events[i].start_date) > maxDate) {
					maxDate = new Date(events[i].start_date);
				}
				if (new Date(events[i].start_date) < minDate) {
					minDate = new Date(events[i].start_date);
				}
				events[i].period = this.getPeriod(events[i].start_date);
			}
			periodArray = this.generatePeriods(minDate, maxDate);


		},
		generatePeriods: function (start, end) {
			var output = [{value:'all', text: 'All Time'}],
				minYear = parseInt(start.getFullYear()),
				minMonth = parseInt(start.getMonth()),
				maxYear = parseInt(end.getFullYear()),
				maxMonth = parseInt(end.getMonth()),
				i,
				j;

			if (minYear == maxYear) {
				for (i = minMonth; i <= maxMonth; i += 1) {
					output.push({
						value: minYear + '-' + i,
						text: this.getMonthName(i) + '/' + minYear
					});
				}
			} else {
				for (i = minMonth; i < 12; i += 1) {
					output.push({
						value: minYear + '-' + i,
						text: this.getMonthName(i) + '/' + minYear
					});
				}
				for (j = minYear + 1; j < maxYear; j += 1) {
					for (i = 0; i < 12; i += 1) {
						output.push({
							value: j + '-' + i,
							text: this.getMonthName(i) + '/' + j
						});	
					}
				}
				for (i = 0; i <= maxMonth; i += 1) {
					output.push({
						value: maxYear + '-' + i,
						text: this.getMonthName(i) + '/' + maxYear
					});
				}
			}

			return output;
		},
		getMonthName: function (index) {
			var months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
			//console.log(index, months[index]);
			return months[index];
		},
		getPeriod: function (date_string) {
			var d = new Date(date_string);
			return d.getFullYear() + '-' + d.getMonth();
		},
		renderPage: function () {
			$(window).resize(function() {
				$('#swoop').height($(document).height());
			});
			$('#swoop').height($(document).height());
			$('#swoop').layout({
				east: {
            		size: 200,
            		maxSize: 270,
            		minSize: 150  
        		},
        		north: {
            		size: 82,
            		spacing_open: 0,
            		closable: false,
            		slidable: false,
            		resizable: false
        		},
        		south: {
        			size: 50
        		}
			});
			$('#timeline').slider({
				value: 0,
				min: 0,
				max: periodArray.length - 1,
				slide: function( event, ui ) {
					$("#timeline_label" ).html(periodArray[ui.value].text);
					swoop.setPeriod(periodArray[ui.value].value, ui.value, true);
				}
			});
		},
		showData: function () {
			var regions = {
				'all': 'World',
				'NA': 'North America',
				'SA': 'South America',
				'EU': 'Europe',
				'AF': 'Africa',
				'AS': 'Asia',
				'OC': 'Oceania'
			};
			var html = '<div id="detailTop"><strong>' + swoop.getTotal() + '</strong> Event(s) found @ ' + regions[region] + ' in ' + periodArray[periodIndex].text; 
			if (!signed) {
				html += '    (<small>Please Sign In with Google+ account to have more details</small>)';
			}
			html += '</div>';
			$('#centerPanel').html(html);
			if (signed) {

			} else {
				aoColumns = [
					{ "sTitle": "Country" },
		            //{ "sTitle": "State" },
		            { "sTitle": "City" },
		            { "sTitle": "Date", "sClass": "center" },
		            { "sTitle": "WebSite", "sClass":"right"}
				];
				current = startNode;
				aaData = [];
				while(current) {
					aRow = [];
					aRow.push(current.country);
					aRow.push(current.city);

					tmpDate = new Date(current.start_date);
					aRow.push(tmpDate.getMonth() + '/' + tmpDate.getDate() + '/' + tmpDate.getFullYear());

					aRow.push("<a target='_blank' href='//" + current.website + "'>" + current.website + "</a>");
					aaData.push(aRow);
					current = current.next;
				}

				$('#centerPanel').append('<table cellpadding="0" cellspacing="0" border="0" class="display" id="swData"></table>');
				$('#swData').dataTable({
					"aaData": aaData,
					"aoColumns" : aoColumns,
					"bPaginate": false,
			        "bLengthChange": false,
			        "bFilter": true,
			        "bSort": false,
			        "bInfo": false,
			        "bAutoWidth": false
				});
			}

		},
		setRegion: function (newRegion, update) {
			oldRegion = region;
			region = newRegion;
			if (update) {
				this.prepareTimeLine();
				this.showData();
			}
			$('#it_' + oldRegion).removeClass('selected');
			$('#it_' + region).addClass('selected');
		},
		setPeriod: function (newPeriod, index, update) {
			period = newPeriod;
			periodIndex = index;
			if (update) {
				this.prepareTimeLine();
				this.showData();
			}
		},
		getStartNode: function () {
			return startNode;
		},
		getEndNode: function () {
			return endNode;
		},
		getTotal: function () {
			return total;
		},
		getCurentNode: function () {
			return currentNode;
		},
		getPrevNode: function (update) {
			var node;
			node = currentNode.prev;
			if (update) {
				currentNode = node;
			}
			return node;
		},
		getNextNode: function (update) {
			var node;
			node = currentNode.next;
			if (update) {
				currentNode = node;
			}
			return node;
		},
		insertOrderedNode: function (node) {
			var found = false;
			if (startNode) {
				current = startNode;
				lastNode = startNode;
				while (!found && current){
					if (new Date(current.start_date) > new Date(node.start_date)) {
						found = true;
						node.next = current;
						current.prev = node;
						node.prev = current.prev;
						current.prev.next = node;
					} else {
						lastNode = current;
						current = current.next;
					}
				}
				if (!found) {
					node.prev = lastNode;
					lastNode.next = node;
					endNode = node;
				}
			} else {
				startNode = node;
				endNode = node;
			}
		},
		setSigned: function (state, user, t) {
			signed = state;
			user = user;
			//console.log(user);
			token = t || null;
			if (signed) {
				$('#profile_user').html(user.displayName);
				$('#profile_user').attr('href', user.url);
				$('#profile_img').attr('src',user.image.url);
				$('#profileSpan').removeClass().addClass('top_right');
				$('#signinButton').removeClass().addClass('pane');
			} else {
				$('#profileSpan').removeClass().addClass('pane');
				$('#signinButton').removeClass().addClass('top_right');
			}
			this.showData();
		},
		getToken: function () {
			return token;
		}
	};
};

SWEvent = function (options) {
	var defaults = {
		vertical: null,
		twitter_hashtag: null,
		location: null,
		facilitators: []
	};
	$.extend(true, defaults, options);
	this.next = null;
	this.prev = null;
	this.region = null;
	this.period = null;
	this.id = defaults.id;
	this.city = defaults.city;
	this.state = defaults.state;
	this.country = defaults.country;
	this.vertical = defaults.vertical;
	this.start_date = defaults.start_date;
	this.website = defaults.website;
	this.twitter_hashtag = defaults.twitter_hashtag;
	this.location = this.locationFactory(defaults.location);
	this.facilitators = this.facilitatorsFactory(defaults.facilitators);
};

SWEvent.prototype.locationFactory = function (options) {
	var output = null;
	if (options) {
		output = new SWLocation(options);
	} 
	return output;
};

SWEvent.prototype.facilitatorsFactory = function (options) {
	var output = [],
		j,
		newFacilitator;

	if (options && options.length > 0) {
		for (j = 0; j < options.length; j += 1) {
			newFacilitator = new SWFacilitator(options[j]);
			output.push(newFacilitator);
		}
	}
	return output;
};

SWLocation = function (options) {
	this.lat = options.lat;
	this.lng = options.lng;
};

SWLocation.prototype.getMap = function () {
	//TODO Implement Google Maps API
};

SWFacilitator = function (options) {
	this.id = options._id;
	this.first_name = options.first_name;
	this.last_name = options.last_name;
	this.name = options.name;
};

SWFacilitator.prototype.getGPlus = function () {
	//TODO Implement Google + API
};



