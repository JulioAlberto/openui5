/*!
 * ${copyright}
 */

sap.ui.define(['jquery.sap.global', 'sap/ui/base/ManagedObject'],
	function (jQuery, ManagedObject) {
		'use strict';
		var TimelineOverview = ManagedObject.extend("sap.ui.core.support.controls.TimelineOverview", {});

		TimelineOverview.prototype.setInteractions = function (interactions) {

			this.interactions = (JSON.parse(JSON.stringify(interactions)));

			if (!interactions || !interactions.length) {
				return;
			}

			this.actualStartTime = interactions[0].start;
			this.actualEndTime = interactions[interactions.length - 1].end;

			this.timeRange = this.actualEndTime - this.actualStartTime;
			this.maxDuration = 0;
			var that = this;
			this.interactions.forEach(function(interaction){
				interaction.start = parseFloat((interaction.start - that.actualStartTime).toFixed(2));
				interaction.end = parseFloat((interaction.end - that.actualStartTime).toFixed(2));
				interaction.calculatedDuration = interaction.end - interaction.start;
				if (interaction.calculatedDuration > that.maxDuration) {
					that.maxDuration = interaction.calculatedDuration;
				}
			});

		};

		TimelineOverview.prototype.render = function (rm) {
			rm.write('<div id="sapUiInteractionTimelineOverview"><ol id="' + this.getId() + '"');

			rm.addClass("InteractionTimeline");

			rm.writeClasses();

			rm.write(">");


			var interaction,
				interactions = this.interactions;

			if (!interactions || !interactions.length) {
				return;
			}

			//get the data to be rendered
			var stepsData = this._getTimelineOverviewData(interactions);

			//find the max duration
			var that = this;
			stepsData.forEach(function(stepObject) {
				if (stepObject.totalDuration > that.maxDuration) {
					that.maxDuration = stepObject.totalDuration;
				}
			});

			//render the data ==========================================================================================

			for (var i = 0; i < stepsData.length; i++) {
				interaction = stepsData[i];

				this.renderInteractionStep(rm, interaction);
			}

			rm.write("</ol></div>");
		};

		TimelineOverview.prototype.renderInteractionStep = function (rm, step) {
			var stepDurationInPercent = Math.ceil((step.totalDuration / this.maxDuration) * 100);

			var stepDurationInPercentInlineStyle = 'height: ' + stepDurationInPercent + '%;';
			if (stepDurationInPercent > 0) {
				stepDurationInPercentInlineStyle += ' min-height: 1px;';
			}

			rm.write('<li>');
			rm.write('<div class="bars-wrapper" title="Duration: ' + step.totalDuration + 'ms">');
			rm.write('<div class="duration" style="' + stepDurationInPercentInlineStyle + '">');
			// write step duration
			var aInteractions = step.interactions,
				stepInteractionInPercent = 100;
			aInteractions.forEach(function(interaction, index) {
				stepInteractionInPercent = (step.totalDuration === 0) ? 100 : Math.ceil((interaction.calculatedDuration / step.totalDuration) * 100);
				rm.write('<div class="requestType" style="height: ' + stepInteractionInPercent + '%; min-height: 1px;"></div>');
				//write spacer between interactions
				if (index !== (aInteractions.length - 1)) {
					rm.write('<div style="min-height: 1px;"></div>');
				}
			});


			rm.write('</div>');
			rm.write('</div>');
			rm.write('<div class="sapUiInteractionTimelineStepRight"></div>');
			rm.write('</li>');
		};
		TimelineOverview.prototype._getTimelineOverviewData = function(copiedData) {
			var stepCount = 60;
			var stepTime = this.timeRange / stepCount;
			var stepsData = [],
				oldStepItem = { interactions: [] },
				bAlreadyInserted = true;

			for (var i = 0; i < stepCount; i++) {
				var stepStart = stepTime * i;
				var stepEnd = stepStart + stepTime;
				var selectedStepsByTime = this._filterByTime({start: stepStart, end: stepEnd}, copiedData);

				/* eslint-disable no-loop-func */
				var stepItem = {
					interactions: selectedStepsByTime,
					totalDuration: 0
				};

				selectedStepsByTime.map(function(step) {
					stepItem.totalDuration += step.calculatedDuration;
				});
				/* eslint-enable no-loop-func */

				bAlreadyInserted = selectedStepsByTime.length > 0 &&
					oldStepItem.interactions.length > 0 &&
					selectedStepsByTime[0].start === oldStepItem.interactions[0].start;
				if (!bAlreadyInserted) {
					stepsData.push(stepItem);
					oldStepItem = stepItem;
				}


			}

			return stepsData;
		};

		TimelineOverview.prototype._filterByTime = function (options, filteredData) {
			return filteredData.filter(function (item) {
				//filter bars in time start/end
				return !(item.end <= options.start || item.start >= options.end);
			}).map(function (item) {


				var leftDurationOffset = Math.max(options.start - item.start, 0);
				var rightDurationOffset = Math.max((item.start + item.duration) - options.end, 0);
				item.duration = item.duration - leftDurationOffset - rightDurationOffset;

				//cut the start and end of bars
				item.start = Math.max(item.start, options.start);
				item.end = Math.min(item.end, options.end);
				return item;
			});
		};

		return TimelineOverview;
	});