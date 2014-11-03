// ------------------------- jCalendar Plugin ------------------------- //
// Description: This plugin shows a calendar and allows to show
//              events and select multiple dates
//      Author: Daff
//     License: Sharing Academy S.L.
//     Version: v3.1
// ----------------------------------------------------------------- //
$.fn.jCalendar = function(options){
    // extend the options with the default ones
    var settings = $.extend({
        languageMonthLong : ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"],
        languageMonthShort : ["Gen", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
        languageDowLong : ["Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte"],
        languageDowMedium : ["Dg", "Dl", "Dt", "Dc", "Dj", "Dv", "Ds"],
        languageDowShort : ["D", "L", "M", "X", "J", "V", "S"],
        allowMonthNavigation : true,
        allowEvents : false,
        allowMultipleDates : true,
        toggleDates: true,
        showActiveDay : false,
        shortDaysOfWeek : false,
        calendarStartDate : new Date(),
        calendarOtherMonthDays : true,
        calendarOtherMonthDaysNavigation : true,
        dowOrder : [1, 2, 3, 4, 5, 6, 0],
        eventsNoneText : 'Ninguna data seleccionada',
        eventsPassedHidden : false,
        eventsSourceURL : false,
        events : [],
        navigationShowYear : true,
        debugMode: true
    }, options);

    // AVOID BUGS
    if(settings.calendarStartDate instanceof Date == false) throw "Not valid Date Object on calendarStartDate";

    // CREATE CALENDARS
    // html struct vars
    /*
            var calendarStruct = '<div id="jCalendarBox">' + ((settings.allowEvents) ? ('<div id="jCalendarEventBox" class="jCalendarTopBox"><div class="EventDateLabel"></div><div class="EventTextLabel"></div></div>') : '') + '<div class="jCalendarDatepicker"><div class="jCalendarNavBox"><div id="jCalendarPrevMonth" class="jCalendarNavMonthPrev"><img src="icons/month_left.png" height="10" width="10" alt="Previous month" /></div><div id="jCalendarMonthCaption" class="jCalendarNavMonthCaptionBox"></div><div id="jCalendarNextMonth" class="jCalendarNavMonthNext"><img src="icons/month_right.png" height="10" width="10" alt="Next month" /></div></div><div id="jCalendarMonthBox" class="jCalendarMonthBox"></div></div></div>';
            var monthStruct = '<div class="jCalendarMonth"><div class="jCalendarDow"></div><div class="jCalendarDays"></div></div>';
            var monthDowStruct = '<div class="jCalendarDowItem"></div>';
            var monthWeekStruct = '<div class="jCalendarWeek"></div>';
            var monthDayStruct = '<div class="jCalendarDay"></div>';
            var htmlTempMonthStruct = '';
            var htmlFinalStruct = '';
            var idCalendar = "#jCalendarBox"+index;
            var idCalendarEventBox = "#jCalendarEventBox"+index;
            var idCalendarMonthBox = "#jCalendarMonthBox"+index;
        */

    // get the item
    $this = $(this);

    // date vars
    var selectedDate = settings.calendarStartDate;
    var selectedDates = [];

    // append calendar
    $this.append(getFullStructure());
    doLog("Built");

    // select the active day
    if (!settings.allowMultipleDates) selectDay($this.children(".jCalendarDayActive"));

    // hooks
    $this.find(".jCalendarMonthBox").on("click", ".jCalendarDay", function(e) {
        doLog("Day clicked " + $(this).text());
        if (settings.allowMultipleDates) chooseDay(this);
        else selectDay(this);

        doLog("Calling click()");
        if (options &&
            options.hasOwnProperty("click") &&
            typeof options.click !== "undefined" &&
            options.click) options.click((settings.allowMultipleDates) ? selectedDates : selectedDate);
    });
    if(settings.allowMonthNavigation) {
        doLog("Allowing Navigation");
        $this.find(".jCalendarNavBox").on("click", ".jCalendarNavMonthPrev", function(e) {
            doLog("Next Month Called");
            selectedDate = getPreviousMonthDate(selectedDate);
            doLog("Selected date " + selectedDate);
            refreshMonthFromDate(selectedDate);
            doLog("Refreshing Month");
        });
        $this.find(".jCalendarNavBox").on("click", ".jCalendarNavMonthNext", function(e) {
            doLog("Previous Month Called");
            selectedDate = getNextMonthDate(selectedDate);
            doLog("Selected date " + selectedDate);
            refreshMonthFromDate(selectedDate);
            doLog("Refreshing Month");
        });
    }
    doLog("Ready");

    // functions
    function refreshMonthFromDate(date) {
        $this.children().find(".jCalendarMonthBox").html(getMonthBox(date.getFullYear(), date.getMonth(), date.getDate()));
        $this.children().find(".jCalendarNavMonthCaptionBox").html(settings.languageMonthLong[date.getMonth()] + ((settings.navigationShowYear) ? (' ' + date.getFullYear()) : ""));
    }
    function getMonthBox(year, month, day) {
        var htmlDowBuild = '';
        var htmlWeekBuild = '';
        var htmlMonthBuild = '';
        // create dows
        for(var i = 0; i < settings.dowOrder.length; i++) {
            htmlDowBuild += '<div class="jCalendarDowItem">' + ((settings.shortDaysOfWeek) ? settings.languageDowShort[settings.dowOrder[i]] : settings.languageDowMedium[settings.dowOrder[i]]) + '</div>';
        }
        // declare needed vars
        var noWeeks = getMonthWeeks(year, month);
        var startMonthDayDow = getDowDay(year, month, 1);
        var endMonthDayDow = getDowDay(year, month+1, 0);
        var currentDay = 1;
        // build each week
        for(var i = 0; i < noWeeks; i++) {
            var days = '';
            if(i == 0 && startMonthDayDow != settings.dowOrder[0]) {
                // abnormal week
                var noOthers = getDayDistanceFromFirstDow(year, month);
                var firstMonthOtherDay = getMonthDays(year, month-1) - noOthers + 1;
                for(var ii = 0; ii < 7; ii++) {
                    if(ii < noOthers) {
                        if(settings.calendarOtherMonthDays) {
                            days += '<div class="jCalendarDay jCalendarDayOther">' + firstMonthOtherDay++ + '</div>';
                        } else {
                            days += '<div class="jCalendarDay jCalendarDayBlank">&nbsp;</div>';
                        }
                    } else {
                        days += '<div class="jCalendarDay ' + getClassDay(year, month, currentDay) + '">' + currentDay++ + '</div>';
                    }
                }
            } else if(i == noWeeks-1 && endMonthDayDow != settings.dowOrder[settings.dowOrder.length - 1]) {
                // abnormal week
                var noOthers = getDayDistanceToLastDow(year, month);
                var firstMonthOtherDay = 1;
                for(var ii = 0; ii < 7; ii++) {
                    if(ii >= 7 - noOthers) {
                        if(settings.calendarOtherMonthDays) {
                            days += '<div class="jCalendarDay jCalendarDayOther">' + firstMonthOtherDay++ + '</div>';
                        } else {
                            days += '<div class="jCalendarDay jCalendarDayBlank">&nbsp;</div>';
                        }
                    } else {
                        days += '<div class="jCalendarDay ' + getClassDay(year, month, currentDay) + '">' + currentDay++ + '</div>';
                    }
                }
            } else {
                for(var ii = 0; ii < 7; ii++) {
                    days += '<div class="jCalendarDay ' + getClassDay(year, month, currentDay) + '">' + currentDay++ + '</div>';
                }
            }
            // build the week
            htmlWeekBuild += '<div class="jCalendarWeek">' + days + '</div>';
        }
        return '<div class="jCalendarMonth"><div class="jCalendarDow">' + htmlDowBuild + '</div><div class="jCalendarDays">' + htmlWeekBuild + '</div></div>';
    }
    function chooseDay(dayObj) {
        if(!$(dayObj).is(".jCalendarDayOther")) {
            selectedDate.setDate($(dayObj).text());

            if (!$(dayObj).is(".jCalendarDaySelected")) {
                $(dayObj).addClass("jCalendarDaySelected");

                selectedDates.push(new Date(selectedDate.getTime()));

                doLog("Calling change()");
                if (options &&
                    options.hasOwnProperty("change") &&
                    typeof options.change !== "undefined" &&
                    options.change) options.change((settings.allowMultipleDates) ? selectedDates : selectedDate);
            } else if (settings.toggleDates) {
                $(dayObj).removeClass("jCalendarDaySelected");

                var ind = getIndexOfDates(selectedDate);
                if (ind > -1) {
                    selectedDates.splice(ind, 1);
                }

                doLog("Calling change()");
                if (options &&
                    options.hasOwnProperty("change") &&
                    typeof options.change !== "undefined" &&
                    options.change) options.change((settings.allowMultipleDates) ? selectedDates : selectedDate);
            }


        } else if(settings.calendarOtherMonthDaysNavigation) {
            if($(dayObj).text() > 15) {
                selectedDate = getPreviousMonthDate(selectedDate);
            } else {
                selectedDate = getNextMonthDate(selectedDate);
            }

            refreshMonthFromDate(selectedDate);

            $("#jCalendarBox > .jCalendarDatepicker").find(".jCalendarDay").each(function(index, element) {
                if(!$(this).is(".jCalendarDayOther") && $(this).text() == $(dayObj).text()) {
                    chooseDay(this);
                }
            });
        }

        doLog("Days selected: " + selectedDates);
    }
    function selectDay(dayObj) {
        if(!$(dayObj).is(".jCalendarDayOther")) {
            $(".jCalendarDay").removeClass("jCalendarDaySelected").removeClass("jCalendarDayEventSelected");
            selectedDate.setDate($(dayObj).text());

            if(!$(dayObj).is(".jCalendarDayActive")) {
                $(dayObj).addClass("jCalendarDaySelected");
            }

            if (settings.allowEvents) {
                var eventId = getEvent(selectedDate.getFullYear(), selectedDate.getMonth(), $(dayObj).text());
                displayEvent(eventId);

                if(eventId != -1) {
                    $(dayObj).addClass("jCalendarDayEventSelected");
                }
            }
        } else if(settings.calendarOtherMonthDaysNavigation) {
            if($(dayObj).text() > 15) {
                selectedDate = getPreviousMonthDate(selectedDate);
            } else {
                selectedDate = getNextMonthDate(selectedDate);
            }
            refreshMonthFromDate(selectedDate);
            $("#jCalendarBox > .jCalendarDatepicker").find(".jCalendarDay").each(function(index, element) {
                if(!$(this).is(".jCalendarDayOther") && $(this).text() == $(dayObj).text()) {
                    selectDay(this);
                }
            });
        }

        doLog("Calling change()");
        if (options &&
            options.hasOwnProperty("change") &&
            typeof options.change !== "undefined" &&
            options.change) options.change((settings.allowMultipleDates) ? selectedDates : selectedDate);
        doLog("Day selected: " + selectedDate);
    }

    // events functions
    function isEvent(year, month, day) {
        return (getEvent(year, month, day) != -1);
    }
    function getEvent(year, month, day) {
        // go through each event
        for(var i = 0; i < settings.events.length; i++) {
            var dateParsed = parseDate(settings.events[i].date);
            if(settings.events[i].repeat && datesAreEqualFromDateAndVars(dateParsed, dateParsed.getFullYear(), month, day)) return i;
            if(datesAreEqualFromDateAndVars(dateParsed, year, month, day)) return i;
        }
        return -1;
    }
    function showEvent(id) {
        $this.find(".jCalendarEventBox > .EventDateLabel").text(showDate(parseDate((settings.events[id].repeat) ? selectedDate : settings.events[id].date).getFullYear(), parseDate(settings.events[id].date).getMonth(), parseDate(settings.events[id].date).getDate()));
        $this.find(".jCalendarEventBox > .EventTextLabel").text(settings.events[id].text);
    }
    function displayEvent(eventId) {
        if(settings.events.hasOwnProperty(eventId)) {
            showEvent(eventId);
        } else {
            $("#jCalendarEventBox > .EventDateLabel").text(showDate(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()));
            $("#jCalendarEventBox > .EventTextLabel").text(settings.eventsNoneText);
        }
    }

    // day selection functions
    function getClassDay(year, month, day) {
        if (settings.allowEvents) {
            var i = getEvent(year, month, day);
            if(i != -1) {
                if(settings.eventsPassedHidden && dateHasPassed(year, month, day)) {
                    return '';
                } else {
                    if(datesAreEqualFromDateAndVars(new Date(), year, month, day)) return "jCalendarDayEvent jCalendarDayActive";
                    else return "jCalendarDayEvent";
                }
            }
        }

        if (settings.allowMultipleDates) {
            if (multipleDateSelected(year, month, day))
                return "jCalendarDaySelected";
            else
                return "";
        }

        if(datesAreEqualFromDateAndVars(new Date(), year, month, day)) return "jCalendarDayActive";
        return '';
    }

    // multiple date functions
    function multipleDateSelected(year, month, day) {
        for (var i = 0; i < selectedDates.length; i++) {
            if (datesAreEqualFromDateAndVars(selectedDates[i], year, month, day)) return true;
        }
        return false;
    }
    function getIndexOfDates(date) {
        for (var i = 0; i < selectedDates.length; i++) {
            if (datesAreEqualFromDates(selectedDates[i], date)) return i;
        }
        return -1;
    }

    // date functions
    function showDate(year, month, day){
        var strTemp ='';
        if(day<10){
            strTemp = "0" + day +"/";
        }else{
            strTemp = day +"/";
        }
        if(month+1<10){
            strTemp += "0" +(month+1);
        }else{
            strTemp += (month+1);
        }
        strTemp += "/" +year;
        return strTemp;
    }
    function dateHasPassed(year, month, day) {
        return (new Date(year, month, day) < new Date());
    }
    function datesAreEqualFromDates(date1, date2) {
        return (date1.getFullYear() == date2.getFullYear() && date1.getMonth() == date2.getMonth() && date1.getDate() == date2.getDate());
    }
    function datesAreEqualFromDateAndVars(date, year, month, day) {
        return (date.getFullYear() == year && date.getMonth() == month && date.getDate() == day);
    }
    function datesAreEqualFromVars(year1, month1, day1, year2, month2, day2) {
        return (year1 == year2 && month1 == month2 && day1 == day2);
    }
    function parseDate(strDate) {
        return new Date(Date.parse(strDate));
    }
    function getMonthDays(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }
    function getMonthWeeks(year, month) {
        return (getMonthDays(year, month) + getDayDistanceFromFirstDow(year, month) + getDayDistanceToLastDow(year, month)) / 7;
    }
    function getDowDay(year, month, day) {
        return new Date(year, month, day).getDay();
    }
    function getPreviousMonthDate(date) {
        if(date.getMonth() == 0) {
            date.setFullYear(date.getFullYear() - 1);
            date.setMonth(11);
        } else {
            date.setMonth(date.getMonth() - 1);
        }
        return date;
    }
    function getNextMonthDate(date) {
        if(date.getMonth() == 12) {
            date.setFullYear(date.getFullYear() + 1);
            date.setMonth(0);
        } else {
            date.setMonth(date.getMonth() + 1);
        }
        return date;
    }
    function getDayDistanceFromFirstDow(year, month) {
        var firstDow = getDowDay(year, month, 1);
        return (firstDow == 0) ? 6 : firstDow - settings.dowOrder[0]; // TODO: Fix order because 0 is sunday
    }
    function getDayDistanceToLastDow(year, month) {
        var lastDow = getDowDay(year, month+1, 0);
        return (lastDow == 0) ? 0 : 7 - lastDow; // TODO: Fix order because 0 is sunday
    }

    // build functions
    function getFullStructure() {
        return '<div id="jCalendarBox">' +
        ((settings.allowEvents) ? ('<div id="jCalendarEventBox" class="jCalendarTopBox"><div class="EventDateLabel"></div><div class="EventTextLabel"></div></div>') : '') +
        '<div class="jCalendarDatepicker">' +
        '<div class="jCalendarNavBox">' +
        ((settings.allowMonthNavigation) ? ('<span id="jCalendarPrevMonth" class="jCalendarNavMonthPrev glyphicon glyphicon-chevron-left"></span>') : '') +
        '<span id="jCalendarMonthCaption" class="jCalendarNavMonthCaptionBox">' + settings.languageMonthLong[selectedDate.getMonth()] + ((settings.navigationShowYear) ? ' ' + selectedDate.getFullYear() : '') + '</span>' +
        ((settings.allowMonthNavigation) ? ('<span id="jCalendarNextMonth" class="jCalendarNavMonthNext  glyphicon glyphicon-chevron-right"></span>') : '') +
        '</div>' +
        '<div id="jCalendarMonthBox" class="jCalendarMonthBox">' + getMonthBox(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) + '</div>' +
        '</div>' +
        '</div>';
    }

    // debug function
    function doLog(text) {
        if (settings.debugMode) console.log("jCalendar: " + text);
    }

    // returning methods
    this.removeDate = function(date) {
        doLog("Removing Date: " + date + " from " + selectedDates);
        var ind = getIndexOfDates(date);
        if (ind > -1) {
            doLog("Date Removing Found");
            selectedDates.splice(ind, 1);
        }
        doLog("Refreshing Month");
        refreshMonthFromDate(selectedDate);
    };
    this.addDate = function(date) {
        doLog("Adding Date" + date);
        selectedDates.push(date);
        doLog("Refreshing Month");
        refreshMonthFromDate(selectedDate);
    };
    this.hasSelectedDate = function (date) {
        return (getIndexOfDates(date) != -1);
    };
    this.getSelectedDates = function () {
        return selectedDates;
    };
    this.getSelectedDate = function () {
        return selectedDate;
    };
    this.gotoNextMonth = function () {
        selectedDate = getNextMonthDate(selectedDate);
        doLog("Selected date " + selectedDate);
        refreshMonthFromDate(selectedDate);
        doLog("Refreshing Month");
    };
    this.gotoPrevMonth = function () {
        selectedDate = getPreviousMonthDate(selectedDate);
        doLog("Selected date " + selectedDate);
        refreshMonthFromDate(selectedDate);
        doLog("Refreshing Month");
    };

    return this;
}