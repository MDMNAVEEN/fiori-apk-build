// ApexCharts
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"MDM_QIR/Formatter/formatter",
	"MDM_QIR/controller/ErrorHandler"
], function(Controller, formatter, ErrorHandler) {
	"use strict";
	var busyDialog = new sap.m.BusyDialog();
	return Controller.extend("MDM_QIR.controller.Analytics", {
		formatter: formatter,
		onInit: function() {
			var vPathImage = jQuery.sap.getModulePath("MDM_QIR") + "/Images/";
			var oImageModel = new sap.ui.model.json.JSONModel({
				path: vPathImage
			});
			this.getView().setModel(oImageModel, "JM_ImageModel");

			var vDate = [{
				Range: "01",
				Value: "Last Week"
			}, {
				Range: "02",
				Value: "This Week"
			}, {
				Range: "03",
				Value: "This Month"
			}, {
				Range: "04",
				Value: "Last Month"
			}, {
				Range: "05",
				Value: "Last 3 Month"
			}, {
				Range: "06",
				Value: "Last 6 Month"
			}, {
				Range: "07",
				Value: "This Year"
			}, {
				Range: "08",
				Value: "Last Year"
			}, {
				Range: "09",
				Value: "Current Financial Year"
			}, {
				Range: "10",
				Value: "Last Financial Year"
			}];
			var oJsonModel = new sap.ui.model.json.JSONModel();
			oJsonModel.setData(vDate);

			this.getView().setModel(oJsonModel, "JMDate");
			var today = new Date();
			var sevenDaysBefore = new Date();
			sevenDaysBefore.setDate(today.getDate() - 90);

			this.getView().byId("DID_FDATE").setDateValue(sevenDaysBefore);
			this.getView().byId("DID_TDATE").setDateValue(today);
			this.oRouter = this.getOwnerComponent().getRouter(this);
			this.oRouter.getRoute("Analytics").attachPatternMatched(this.fnRouter, this);

		},
		fnDateSelection: function() {
			var vSelect = this.getView().byId("UID_CUSTOM").getSelectedKey();
			var vCurrentDate = new Date();
			var vLastFromDate = new Date();
			var vDay = vCurrentDate.getDay();
			var vLasWeekTDate = new Date();
			var vDate = vCurrentDate.getDate();

			switch (vSelect) {
				case '01':
					var vLDay = 7 - vDay;
					vLasWeekTDate = new Date(vLasWeekTDate.setDate(vCurrentDate.getDate() - vLDay));
					vLastFromDate = new Date(vLastFromDate.setDate(vLasWeekTDate.getDate() - 7));
					break;
				case '02':
					vLasWeekTDate = vCurrentDate;
					vLastFromDate = new Date(vLastFromDate.setDate(vCurrentDate.getDate() - vDay));
					break;

				case '03':
					vLasWeekTDate = vCurrentDate;
					var vDate = vDate - 1;
					vLastFromDate = new Date(vLastFromDate.setDate(vCurrentDate.getDate() - vDate));
					break;
				case '04':
					var vDate = vDate;
					var vLastFromDate = new Date(vCurrentDate.getFullYear(), vCurrentDate.getMonth() - 1, 1);

					var vLasWeekTDate = new Date(vCurrentDate.getFullYear(), vCurrentDate.getMonth(), 0);

					break;

				case '05':

					vLasWeekTDate = vCurrentDate;
					vLastFromDate = new Date(vLastFromDate.setDate(vCurrentDate.getDate() - 90));
					break;

				case '06':

					vLasWeekTDate = vCurrentDate;

					vLastFromDate = new Date(vLastFromDate.setDate(vCurrentDate.getDate() - 180));
					break;
				case '07':

					vLasWeekTDate = vCurrentDate;
					vLastFromDate = new Date(vCurrentDate.getFullYear(), 0, 1);
					break;

				case '08':

					vLastFromDate = new Date(vCurrentDate.getFullYear() - 1, 0, 1);
					vLasWeekTDate = new Date(vCurrentDate.getFullYear() - 1, 12, 0);

					break;
				case '10':
					if (vCurrentDate.getMonth() <= 3) {
						vLastFromDate = new Date(vCurrentDate.getFullYear() - 2, 3, 1);
						vLasWeekTDate = new Date(vCurrentDate.getFullYear() - 1, 3, 0);
					} else {
						vLastFromDate = new Date(vCurrentDate.getFullYear() - 1, 3, 1);
						vLasWeekTDate = new Date(vCurrentDate.getFullYear(), 3, 0);
					}

					break;

				case '09':
					if (vCurrentDate.getMonth() <= 3) {
						vLastFromDate = new Date(vCurrentDate.getFullYear() - 1, 3, 1);
						vLasWeekTDate = new Date(vCurrentDate.getFullYear(), 3, 0);
					} else {
						vLastFromDate = new Date(vCurrentDate.getFullYear(), 4, 1);
						vLasWeekTDate = new Date(vCurrentDate.getFullYear() - 1, 3, 0);
					}

					break;
			}

			this.getView().byId("DID_FDATE").setDateValue(vLastFromDate);
			this.getView().byId("DID_TDATE").setDateValue(vLasWeekTDate);
			this.fnDataLoad();

		},
		onAfterRendering: function() {
			this.fnGetMaster();
		},
		fnDataLoad: function(value) {
			var oComponent = this.getOwnerComponent();
			var that = this;
			this.fnGetData(value).then(function(oDataSts) {
				if (oDataSts) {
					busyDialog.open();
					oComponent.getApexLoadedPromise().then(function() {
						that.fnRenderLineChart(that.NavLvlRep);

					});
					oComponent.getApexLoadedPromise().then(function() {
						that.fnrenderDonutChart(that.NavMySla);
					});

					oComponent.getApexLoadedPromise().then(function() {
						that.fnRenderCoulmnChart(that.NavReqSLA);
					});
					oComponent.getApexLoadedPromise().then(function() {
						that.fnRenderLineChart(that.NavLvlRep);
					});
					oComponent.getApexLoadedPromise().then(function() {
						that.fnStackedChart(that.NavOnEscal);
					});
					oComponent.getApexLoadedPromise().then(function() {
						that.fnRenderChangeLog(that.NavChgLog);
					});
					busyDialog.close();
				}
			}.bind(this));

		},
		fnChangeLogSelection: function() {
			var vSelect = this.getView().byId("id_changecustom").getSelectedKey();
			var vCurrentDate = new Date();
			var vLastFromDate = new Date();
			var vDay = vCurrentDate.getDay();
			var vLasWeekTDate = new Date();
			var vDate = vCurrentDate.getDate();

			switch (vSelect) {
				case '01':
					var vLDay = 7 - vDay;
					vLasWeekTDate = new Date(vLasWeekTDate.setDate(vCurrentDate.getDate() - vLDay));
					vLastFromDate = new Date(vLastFromDate.setDate(vLasWeekTDate.getDate() - 7));
					break;
				case '02':
					vLasWeekTDate = vCurrentDate;
					vLastFromDate = new Date(vLastFromDate.setDate(vCurrentDate.getDate() - vDay));
					break;

				case '03':
					vLasWeekTDate = vCurrentDate;
					var vDate = vDate - 1;
					vLastFromDate = new Date(vLastFromDate.setDate(vCurrentDate.getDate() - vDate));
					break;
				case '04':
					var vDate = vDate;
					var vLastFromDate = new Date(vCurrentDate.getFullYear(), vCurrentDate.getMonth() - 1, 1);

					var vLasWeekTDate = new Date(vCurrentDate.getFullYear(), vCurrentDate.getMonth(), 0);

					break;

				case '05':

					vLasWeekTDate = vCurrentDate;
					vLastFromDate = new Date(vLastFromDate.setDate(vCurrentDate.getDate() - 90));
					break;

				case '06':

					vLasWeekTDate = vCurrentDate;

					vLastFromDate = new Date(vLastFromDate.setDate(vCurrentDate.getDate() - 180));
					break;
				case '07':

					vLasWeekTDate = vCurrentDate;
					vLastFromDate = new Date(vCurrentDate.getFullYear(), 0, 1);
					break;

				case '08':

					vLastFromDate = new Date(vCurrentDate.getFullYear() - 1, 0, 1);
					vLasWeekTDate = new Date(vCurrentDate.getFullYear() - 1, 12, 0);

					break;
				case '10':
					if (vCurrentDate.getMonth() <= 3) {
						vLastFromDate = new Date(vCurrentDate.getFullYear() - 2, 3, 1);
						vLasWeekTDate = new Date(vCurrentDate.getFullYear() - 1, 3, 0);
					} else {
						vLastFromDate = new Date(vCurrentDate.getFullYear() - 1, 3, 1);
						vLasWeekTDate = new Date(vCurrentDate.getFullYear(), 3, 0);
					}

					break;

				case '09':
					if (vCurrentDate.getMonth() <= 3) {
						vLastFromDate = new Date(vCurrentDate.getFullYear() - 1, 3, 1);
						vLasWeekTDate = new Date(vCurrentDate.getFullYear(), 3, 0);
					} else {
						vLastFromDate = new Date(vCurrentDate.getFullYear(), 4, 1);
						vLasWeekTDate = new Date(vCurrentDate.getFullYear() - 1, 3, 0);
					}

					break;
			}

			this.getView().byId("id_dfdate").setDateValue(vLastFromDate);
			this.getView().byId("id_dtdate").setDateValue(vLasWeekTDate);

		},
		fnRouter: function() {
			this.fnUsernameGet().then(function(Username) {
				// if (Username !== "" || Username !== undefined) {
				// 	this.fnGetMaster();

				// }
			}.bind(this));

		},
		fnUsernameGet: function() {
			return new Promise(function(Resolve, Reject) {
				var oUserModel = this.getOwnerComponent().getModel("JM_Config");
				busyDialog.open();
				oUserModel.read("/UsernameSet", {
					success: function(oData) {
						var oJsonModel = new sap.ui.model.json.JSONModel();
						oJsonModel.setData(oData.results[0]);
						var username = oData.results[0].Agent;
						this.getView().setModel(oJsonModel, "JM_UserModel");
						Resolve(username);
						//	var uname = oData.results[0].Agent;
						//	this.getView().byId("DID_AGENT").setValue(uname);
						busyDialog.close();
					}.bind(this),
					error: function(oResponse) {
						Reject(undefined);
						busyDialog.close();
						//		var sMessage = ErrorHandler.parseODataError(oResponse);
						//		ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
					}
				});
			}.bind(this));
		},

		fnGetMaster: function() {
			var oModel = this.getView().getModel("JM_Config");
			busyDialog.open();

			var oPayload = {
				FieldId: "RID_MASTER",
				Process: "R",
				F4Type: "F"
			};
			oPayload.NavSerchResult = [];
			var that = this;
			oModel.create("/SearchHelpSet", oPayload, {
				success: function(oData) {
					busyDialog.close();
					var oJAPPModel = new sap.ui.model.json.JSONModel();
					var results = oData.NavSerchResult.results;
					results = results.filter(function(item) {
						return item.DomvalueL !== "" || item.Ddtext !== "";
					});

					oJAPPModel.setData({
						List: results
					});
					that.getView().setModel(oJAPPModel, "JM_AppIdModel");

					that.fnDataLoad(results[0].DomvalueL);

				},
				error: function(oResponse) {
					busyDialog.close();
					var vError = 'E';
					// var vErrorMsg = this.getView().getModel("i18n").getResourceBundle().getText("httprequestfailed");
					// this.fnDisplaySnackBar(vError, vErrorMsg);
					// return;
					ErrorHandler.showCustomSnackbar(this.getView().getModel("i18n").getResourceBundle().getText("httprequestfailed"), "Error",this);
					return;
					// var sMessage = ErrorHandler.parseODataError(oResponse);
					// ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
				}
			});

		},
		fnGetData: function(Value) {
			return new Promise(function(Resolve, Reject) {
				var oModel = this.getView().getModel("JM_Config");
				busyDialog.open();
				var that = this;
				var vMaster = "";
				vMaster = this.getView().byId("UID_APPID").getSelectedKey();
				if (vMaster === "") {
					vMaster = Value;
				}
				var vFDate = that.getView().byId("DID_FDATE").getValue();
				var vTDate = that.getView().byId("DID_TDATE").getValue();
				var vTrans = this.getView().byId("ID_TRANS").getValue();
				var vUser = this.getView().byId("id_leveluser").getValue();
				var vOUser = this.getView().byId("id_ontimeuser").getValue();
				var oPayData = {
					AppId: vMaster,
					Fdate: vFDate,
					Tdate: vTDate,
					Transid: vTrans,
					Luserid: vUser,
					Ouserid: vOUser,
					Sele: 'A',
					NavLvlRep: [],
					NavMySla: [],
					NavOnEscal: [],
					NavReqSLA: [],
					NavUserDet: [],
					NavChgLog: [],
					NavTrans: []
				};
				oModel.create("/Dashboard_HeaderSet", oPayData, {
					success: function(oData) {
						busyDialog.close();
						that.NavMySla = oData.NavMySla.results;
						that.NavReqSLA = oData.NavReqSLA.results;
						that.NavLvlRep = oData.NavLvlRep.results;
						that.NavOnEscal = oData.NavOnEscal.results;
						that.NavChgLog = oData.NavChgLog.results;

						var oJsonModel = new sap.ui.model.json.JSONModel();
						oJsonModel.setData(oData.NavTrans.results);
						oJsonModel.setSizeLimit(oData.NavTrans.results.length);
						that.getView().setModel(oJsonModel, "JMTrans");

						var oJsonModelU = new sap.ui.model.json.JSONModel();
						oJsonModelU.setData(oData.NavUserDet.results);
						oJsonModelU.setSizeLimit(oData.NavUserDet.results.length);
						that.getView().setModel(oJsonModelU, "JMUser");
						var vLength = oData.NavReqSLA.results.length - 1;
						var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
							pattern: "dd/MM/YYYY"
						});

						that.getView().byId("id_startdate").setText(dateFormat.format(oData.NavReqSLA.results[vLength].Startdate));
						that.getView().byId("id_totaltime").setText(oData.NavReqSLA.results[vLength].Timetaken);
						if (that.getView().byId("ID_TRANS").getValue() === "") {
							that.getView().byId("ID_TRANS").setValue(oData.NavTrans.results[0].Transid);
						}
						if (that.getView().byId("id_leveluser").getValue() === "") {
							that.getView().byId("id_leveluser").setValue(oData.NavUserDet.results[0].Userid);
						}
						if (that.getView().byId("id_ontimeuser").getValue() === "") {
							that.getView().byId("id_ontimeuser").setValue(oData.NavUserDet.results[0].Userid);
						}
						that.getView().byId("id_enddate").setText(dateFormat.format(oData.NavReqSLA.results[vLength].Enddate));
						Resolve(true);
					},
					error: function() {
						busyDialog.close();
					}
				});
			}.bind(this));

		},

		fnRenderChangeLog: function(oResults) {

			var aSeries = [];
			var aLabels = [];

			oResults.forEach(function(oItem) {
				aSeries.push(oItem.Ncount);
				aLabels.push(oItem.FnmDes);
			});

			var aColors = [];

			var options = {
				chart: {
					type: "donut",
					height: 150
				},
				dataLabels: {
					enabled: false
				},
				stroke: {
					gap: 4,
					width: 4, // creates separation between slices
					colors: ["#E6E8EA"], // white gap
					lineCap: "square"
				},
				series: aSeries,
				grid: {
					padding: {
						top: -7,
						bottom: -10

					}
				},

				labels: aLabels,
				// colors: aColors,
				legend: {
					position: "bottom",
					fontSize: '10px',
					fontFamily: 'Segoe UI',
					fontWeight: 400,
					markers: {
						size: 7,
						shape: "square",
						strokeWidth: 1,

						customHTML: undefined,
						onClick: undefined,
						offsetX: -10,
						offsetY: 0,
						// fillColors: aColors
					},
					onItemClick: {
						toggleDataSeries: true
					},
					formatter: function(seriesName, opts) {
						var value = opts.w.globals.series[opts.seriesIndex];
						return (
							'<div style="display:flex; justify-content:space-between; width:120px;">' +
							'<span>' + seriesName + '</span>' +
							'<span style="font-weight:500;color:#625F6E">' + value + '</span>' +
							'</div>'
						);
					}
				},

				plotOptions: {
					pie: {
						donut: {
							size: "70%",
							// background:"gray",
							radius: "8px",
							labels: {
								show: true,
								total: {
									show: true,
									label: "Total List",
									fontSize: "9px",
									fontFamily: "Segoe UI",
									fontWeight: 600,
									color: "#4E4B66",
									formatter: function(w) {
										return w.globals.seriesTotals.reduce(function(a, b) {
											return a + b;
										}, 0);
									}
								}
							}
						}
					}
				}
			};

			if (this.changelog) {
				this.changelog.destroy();
			}

			this.changelog = new ApexCharts(
				document.querySelector("#idchangelog"),
				options
			);

			this.changelog.render();
		},

		fnrenderDonutChart: function(oResults) {

			var resultsData = {};
			resultsData.NavMySlaData = [{
				Type: "01",
				Status: "Delayed",
				Count: oResults[0].Delayed
			}, {
				Type: "02",
				Status: "Initiated",
				Count: oResults[0].Initiated
			}, {
				Type: "03",
				Status: "Inprogress",
				Count: oResults[0].Inprogress
			}, {
				Type: "04",
				Status: "Ontime",
				Count: oResults[0].Ontime
			}, {
				Type: "05",
				Status: "Sendback",
				Count: oResults[0].Sendback
			}];

			var aSeries = [];
			var aLabels = [];

			resultsData.NavMySlaData.forEach(function(oItem) {
				aSeries.push(oItem.Count);
				aLabels.push(oItem.Status);
			});

			var oColorMap = {
				"Delayed": "#F79256",
				"Initiated": "#56BDCD",
				"Inprogress": "#D782BA",
				"Ontime": "#80C683",
				"Sendback": "#8085B9"

			};

			var aColors = [];

			aLabels.forEach(function(sStatus) {
				aColors.push(oColorMap[sStatus] || "#CCCCCC"); // fallback color
			});

			var options = {
				chart: {
					type: "donut",
					height: 253
				},
				dataLabels: {
					enabled: false
				},
				stroke: {
					gap: 3,
					width: 3, // creates separation between slices
					colors: ["#E6E8EA"], // white gap
					lineCap: "square"
				},
				series: aSeries,

				labels: aLabels,
				colors: aColors,
				legend: {
					position: "bottom",
					fontSize: '13px',
					fontFamily: 'Segoe UI',
					fontWeight: 400,
					markers: {
						size: 7,
						shape: "square",
						strokeWidth: 1,

						customHTML: undefined,
						onClick: undefined,
						offsetX: -10,
						offsetY: 0,
						fillColors: aColors
					},
					onItemClick: {
						toggleDataSeries: true
					},
					formatter: function(seriesName, opts) {
						var value = opts.w.globals.series[opts.seriesIndex];
						return (
							'<div style="display:flex; justify-content:space-between; width:130px;">' +
							'<span>' + seriesName + '</span>' +
							'<span style="font-weight:500;color:#625F6E">' + value + '</span>' +
							'</div>'
						);
					}
				},

				plotOptions: {
					pie: {
						donut: {
							size: "70%",
							// background:"gray",
							radius: "8px",
							labels: {
								show: true,
								total: {
									show: true,
									label: "Total Records",
									fontSize: "10px",
									fontFamily: "Segoe UI",
									fontWeight: 600,
									color: "#4E4B66",
									formatter: function(w) {
										return w.globals.seriesTotals.reduce(function(a, b) {
											return a + b;
										}, 0);
									}
								}
							}
						}
					}
				}
			};

			if (this._chart) {
				this._chart.destroy();
			}

			this._chart = new ApexCharts(
				document.querySelector("#chart"),
				options
			);

			this._chart.render();
		},
		fnRenderCoulmnChart: function(oResults) {
			var aData = oResults;
			var options = {
				series: [{
					name: 'Total Time',
					data: aData.map(function(item) {
						return item.Hourstime.trim();
					})
				}],
				chart: {
					type: 'bar',
					height: 172, // Adjusted to match the visual scale
					// width: 500,
					toolbar: {
						show: false // Hides the hamburger menu for a cleaner look
					}
				},
				colors: ['#54BEBD'], // Base teal color
				plotOptions: {
					bar: {
						// Settings for top-only rounding
						borderRadius: 15,
						borderRadiusApplication: 'end', // 'end' ensures only the top of the bar is rounded
						borderRadiusWhenStacked: 'last',
						// Creates the rounded tops seen in your image
						columnWidth: '50%', // Adjusts thickness of the bars
						distributed: false,
						dataLabels: {
							position: 'top'
						}
					}
				},
				// THE GRADIENT ALGORITHM
				fill: {
					type: 'gradient',
					gradient: {
						shade: 'light',
						type: "vertical", // Matches 180deg
						shadeIntensity: 0.5,
						inverseColors: false, // Ensures gradient follows top-to-bottom
						opacityFrom: 1, // 0% stop (Full color #54BEBD)
						opacityTo: 0.1, // 100% stop (rgba transparency)
						stops: [0, 100] // Start and end points
					}
				},
				dataLabels: {
					enabled: false // Hide numbers on top of bars as per screenshot
				},

				grid: {
					borderColor: '#f1f1f1',
					xaxis: {
						lines: {
							show: false
						},

					},
					yaxis: {
						lines: {
							show: true // Kept for the horizontal reference lines

						}
					}
				},
				xaxis: {
					categories: aData.map(function(item) {
						return item.Lvl;
					}),
					labels: {
						style: {
							fontSize: '10px',
							fontFamily: 'Segoe UI Semibold',
							color: '#000000B2'
						}
					},

					axisBorder: {
						show: false
					},
					axisTicks: {
						show: false
					}

				},
				yaxis: {
					labels: {
						formatter: function(val) {
							return val + "hr"; // Adds 'hr' unit to the Y-axis
						},
						style: {
							fontSize: '10px',
							fontFamily: 'Segoe UI Semibold',
							color: '#000000B2'
						}
					}
				},
				tooltip: {
					y: {
						formatter: function(val) {
							return val + " Hours";
						}
					}
				}
			};

			if (this._columnchart) {
				this._columnchart.destroy();
			}
			this._columnchart = new ApexCharts(
				document.querySelector("#columnchart"),
				options
			);

			this._columnchart.render();
			//	this._createChart("columnchart", options);
		},
		fnRenderLineChart: function(oResults) {
			var vType;

			if (oResults[0].Type === 'D') {
				vType = 'Day';
			} else if (oResults[0].Type === 'M') {
				vType = 'Month';
			} else if (oResults[0].Type === 'W') {
				vType = 'Week';
			} else {
				vType = "";
			}
			var options = {
				series: [{
					name: "Initiated",

					data: oResults.map(function(item) {
						return item.Initiated;
					})
				}, {
					name: "Drafted",

					data: oResults.map(function(item) {
						return item.Drafted;
					})
				}, {
					name: "Approved",

					data: oResults.map(function(item) {
						return item.Approved;
					})
				}, {
					name: "Rejected",

					data: oResults.map(function(item) {
						return item.Rejected;
					})
				}],

				chart: {
					type: 'area', // Use area to get the light color fill under the lines
					height: 245,
					toolbar: {
						show: false
					},
					zoom: {
						enabled: false
					},
					dropShadow: {
						enabled: true,
						color: '#3CC3DF',
						top: 6, // Vertical offset (how far it drops)
						left: 0, // Horizontal offset
						blur: 6, // The "fuzziness"
						opacity: 0.2, // Transparency (0.2 matches your #FFAE4C66 alpha)
						// color: '#000' // Usually black looks best for depth
					}
				},

				colors: ['#3CC3DF', '#FFAE4C', '#8979FF', '#FF928A'],
				stroke: {
					curve: 'smooth',
					width: 1
				},
				fill: {
					type: 'gradient',
					gradient: {
						shadeIntensity: 1,
						opacityFrom: 0.2, // Light fill under the line
						opacityTo: 0.1,
						stops: [0, 90, 100]
					}
				},
				markers: {
					size: 2,
					colors: ['#fff'], // White center
					strokeColors: ['#3CC3DF', '#FFAE4C', '#8979FF', '#FF928A'], // Border matches line color
					strokeWidth: 1,
					hover: {
						size: 1
					}
				},
				dataLabels: {
					enabled: false
				},
				xaxis: {
					categories: oResults.map(function(item) {
						return item.Ndays;
					}),

					axisBorder: {
						show: false
					},
					tooltip: {
						enabled: false
					}
				},

				tooltip: {
					x: {
						formatter: function(value) {
							return vType + " " + value;
						}
					}
				},
				legend: {
					position: 'bottom',
					horizontalAlign: 'center',
					fontSize: '11px',
					fontFamily: 'Segoe UI',
					fontWeight: 500,

					markers: {
						size: 4,
						strokeWidth: 1

					},

					// formatter: function(seriesName, opts) {
					// 	// Get the specific color for this series index
					// 	var seriesColor = opts.w.globals.colors[opts.seriesIndex];

					// 	// Return the bracket with the dynamic color + the name
					// 	return '<span class="tag-marker" style="color:' + seriesColor + '">&lt;&gt;</span>' +
					// 		'<span class="legend-label-text">' + seriesName + '</span>';
					// }
				},
				grid: {
					borderColor: '#f1f1f1',
					strokeDashArray: 3 // Makes the grid lines dashed like in the screenshot
				}
			};
			if (this._linechart) {
				this._linechart.destroy();
			}
			this._linechart = new ApexCharts(
				document.querySelector("#linechart"),
				options
			);

			this._linechart.render();

		},
		fnStackedChart: function(oResults) {
			var vType;

			if (oResults[0].Type === 'D') {
				vType = 'Day';
			} else if (oResults[0].Type === 'M') {
				vType = 'Month';
			} else if (oResults[0].Type === 'W') {
				vType = 'Week';
			} else {
				vType = "";
			}
			var options = {
				series: [{
					name: 'Ontime',
					data: oResults.map(function(item) {
						return item.Ontime;
					})
				}, {
					name: 'Escalated',
					data: oResults.map(function(item) {
						return item.Escalated;
					})
				}],
				chart: {
					type: 'bar',
					height: 180,
					stacked: true, // Key property for stacking
					toolbar: {
						show: false
					}
				},
				colors: ['#2DC381', '#3A9AE5'], // Emerald Green and Peter River Blue
				plotOptions: {
					bar: {
						columnWidth: '50%'
							// borderRadius: 0
					}
				},
				stroke: {
					show: true,
					width: [0, 2],
					colors: ['#328281', '#3A9AE5'] // Manually set darker versions of your teal/blue
				},

				dataLabels: {
					enabled: false
				},

				xaxis: {
					categories: oResults.map(function(item) {
						return item.Ndays;
					}),
					axisBorder: {
						show: false
					},
					axisTicks: {
						show: false
					}
				},
				tooltip: {
					x: {
						formatter: function(value) {
							return vType + " " + value;
						}
					}
				},

				grid: {
					borderColor: '#f1f1f1',
					strokeDashArray: 3,
					padding: {
						top: -20,
						bottom: -10

					}
				},
				legend: {
					position: 'bottom',
					horizontalAlign: 'center'
				}

			};
			if (this._Stackedchart) {
				this._Stackedchart.destroy();
			}
			this._Stackedchart = new ApexCharts(
				document.querySelector("#Stackedchart"),
				options
			);

			this._Stackedchart.render();

		},
		fnChangeLog: function() {

			var oModel = this.getView().getModel("JM_Config");
			busyDialog.open();
			var that = this;
			var vMaster = "";
			vMaster = this.getView().byId("UID_APPID").getSelectedKey();

			var vFDate = that.getView().byId("DID_FDATE").getValue();
			var vTDate = that.getView().byId("DID_TDATE").getValue();

			var oPayData = {
				AppId: vMaster,
				Fdate: vFDate,
				Tdate: vTDate,

				Sele: 'L',

				NavChgRep: []

			};
			oModel.create("/Dashboard_HeaderSet", oPayData, {
				success: function(oData) {
					busyDialog.close();

					var oJsonModel = new sap.ui.model.json.JSONModel();
					oJsonModel.setData(oData.NavChgRep.results);
					oJsonModel.setSizeLimit(oData.NavChgRep.results.length);
					that.getView().setModel(oJsonModel, "JMChangeRep");

					var vArray = oData.NavChgRep.results;
					var vObject = new Set();
					var vUnique = [];
					vArray.forEach(function(item) {
						if (!vObject.has(item.Fnm)) {
							vObject.add(item.Fnm);
							vObject.add(item.FnmDesc);
							vUnique.push(item);
						}
					});
					var oJsonModelArray = new sap.ui.model.json.JSONModel();
					oJsonModelArray.setData(vUnique);
					oJsonModelArray.setSizeLimit(oData.NavChgRep.results.length);
					that.getView().setModel(oJsonModelArray, "JMFieldDet");
					that.fnChangeFrgOpen();

				},
				error: function() {
					busyDialog.close();
				}
			});

		},
		fnChangeRepSearch: function() {
			var oModel = this.getView().getModel("JM_Config");
			busyDialog.open();
			var that = this;

			var vMaster = this.getView().byId("UID_APPID").getSelectedKey();
			var vFname = this.getView().byId("id_dfielddet").getSelectedKey();

			var vFDate = that.getView().byId("id_dfdate").getValue();
			var vTDate = that.getView().byId("id_dtdate").getValue();

			var oPayData = {
				AppId: vMaster,
				Fdate: vFDate,
				Tdate: vTDate,
				Fnane: vFname,

				Sele: 'L',

				NavChgRep: []

			};
			oModel.create("/Dashboard_HeaderSet", oPayData, {
				success: function(oData) {
					busyDialog.close();

					var oJsonModel = new sap.ui.model.json.JSONModel();
					oJsonModel.setData(oData.NavChgRep.results);
					oJsonModel.setSizeLimit(oData.NavChgRep.results.length);
					that.getView().setModel(oJsonModel, "JMChangeRep");

				},
				error: function() {
					busyDialog.close();
				}
			});

		},
		fnCloseChangeLog: function() {
			this.ChangeLog.close();
		},
		fnChangeFrgOpen: function() {
			if (!this.ChangeLog) {
				this.ChangeLog = sap.ui.xmlfragment(this.getView().getId(), "MDM_QIR.Fragments.ChangeLog", this);
				this.getView().addDependent(this.ChangeLog);
			}

			this.ChangeLog.open();
			var vFDate = this.getView().byId("DID_FDATE").getValue();
			var vTDate = this.getView().byId("DID_TDATE").getValue();
			this.byId("id_dfdate").setValue(vFDate);
			this.byId("id_dtdate").setValue(vTDate);
		},
		fnDashboard: function() {
			this.getOwnerComponent().getRouter().navTo("Dashboard");
		},
		fnCompare: function() {
			this.getOwnerComponent().getRouter().navTo("Compare");
		},
		fnDisplaySnackBar: function(MsgType, Message) {
			var vError = this.getView().getModel("i18n").getResourceBundle().getText("Error");
			var vSuccess = this.getView().getModel("i18n").getResourceBundle().getText("Success");
			var vWarning = this.getView().getModel("i18n").getResourceBundle().getText("Warning");
			var vInfo = this.getView().getModel("i18n").getResourceBundle().getText("Info");

			if (!this.snackbar) {
				this.snackbar = sap.ui.xmlfragment("MDM_QIR.Fragment.Snackbar", this);
				this.getView().addDependent(this.snackbar);
			}
			this.snackbar.open();
			var oThat = this;

			var oEntity = {
				MsgType: MsgType,
				Message: Message,
				ImgIcon: ""
			};

			if (MsgType === "E") {
				oEntity.MsgType = vError;
				oEntity.ImgIcon = this.getView().getModel("JM_ImageModel").getProperty("/path") + "Error.svg";
				sap.ui.getCore().byId("id_snackbarBorder").removeStyleClass("cl_snackbarborderSucc");
				sap.ui.getCore().byId("id_snackbarBorder").removeStyleClass("cl_snackbarborderWarn");
				sap.ui.getCore().byId("id_snackbarBorder").removeStyleClass("cl_snackbarborderInfo");
				sap.ui.getCore().byId("id_snackbarHeader").removeStyleClass("cl_snackbarSuccess");
				sap.ui.getCore().byId("id_snackbarHeader").removeStyleClass("cl_snackbarWarn");
				sap.ui.getCore().byId("id_snackbarHeader").removeStyleClass("cl_snackbarInfo");
				sap.ui.getCore().byId("id_snackbarBorder").addStyleClass("cl_snackbarborderError");
				sap.ui.getCore().byId("id_snackbarHeader").addStyleClass("cl_snackbarError");
			} else if (MsgType === "S") {
				oEntity.MsgType = vSuccess;
				oEntity.ImgIcon = this.getView().getModel("JM_ImageModel").getProperty("/path") + "Success.svg";
				sap.ui.getCore().byId("id_snackbarBorder").removeStyleClass("cl_snackbarborderError");
				sap.ui.getCore().byId("id_snackbarBorder").removeStyleClass("cl_snackbarborderWarn");
				sap.ui.getCore().byId("id_snackbarBorder").removeStyleClass("cl_snackbarborderInfo");
				sap.ui.getCore().byId("id_snackbarHeader").removeStyleClass("cl_snackbarError");
				sap.ui.getCore().byId("id_snackbarHeader").removeStyleClass("cl_snackbarWarn");
				sap.ui.getCore().byId("id_snackbarHeader").removeStyleClass("cl_snackbarInfo");
				sap.ui.getCore().byId("id_snackbarBorder").addStyleClass("cl_snackbarborderSucc");
				sap.ui.getCore().byId("id_snackbarHeader").addStyleClass("cl_snackbarSuccess");
			} else if (MsgType === "W") {
				oEntity.MsgType = vWarning;
				oEntity.ImgIcon = this.getView().getModel("JM_ImageModel").getProperty("/path") + "Warning.svg";
				sap.ui.getCore().byId("id_snackbarBorder").removeStyleClass("cl_snackbarborderError");
				sap.ui.getCore().byId("id_snackbarBorder").removeStyleClass("cl_snackbarborderSucc");
				sap.ui.getCore().byId("id_snackbarBorder").removeStyleClass("cl_snackbarborderInfo");
				sap.ui.getCore().byId("id_snackbarHeader").removeStyleClass("cl_snackbarError");
				sap.ui.getCore().byId("id_snackbarHeader").removeStyleClass("cl_snackbarSuccess");
				sap.ui.getCore().byId("id_snackbarHeader").removeStyleClass("cl_snackbarInfo");
				sap.ui.getCore().byId("id_snackbarBorder").addStyleClass("cl_snackbarborderWarn");
				sap.ui.getCore().byId("id_snackbarHeader").addStyleClass("cl_snackbarWarn");
			} else if (MsgType === "I") {
				oEntity.MsgType = vInfo;
				oEntity.ImgIcon = this.getView().getModel("JM_ImageModel").getProperty("/path") + "Information.svg";
				sap.ui.getCore().byId("id_snackbarBorder").removeStyleClass("cl_snackbarborderError");
				sap.ui.getCore().byId("id_snackbarBorder").removeStyleClass("cl_snackbarborderSucc");
				sap.ui.getCore().byId("id_snackbarBorder").removeStyleClass("cl_snackbarborderWarn");
				sap.ui.getCore().byId("id_snackbarHeader").removeStyleClass("cl_snackbarError");
				sap.ui.getCore().byId("id_snackbarHeader").removeStyleClass("cl_snackbarSuccess");
				sap.ui.getCore().byId("id_snackbarBorder").addStyleClass("cl_snackbarborderInfo");
				sap.ui.getCore().byId("id_snackbarHeader").addStyleClass("cl_snackbarInfo");
			}

			var oMsgModel = new sap.ui.model.json.JSONModel(oEntity);
			this.getView().setModel(oMsgModel, "JMMessage");

			//	Hide  timeout
			setTimeout(function() {
				oThat.fnCloseSnackbar();

			}.bind(this), 1500);

		},
		fnChangeLogSearch: function(oEvent) {

			var sQuery = oEvent.getSource().getValue();
			// Get table and binding
			var oTable = this.byId("DIDCHANGELOG");
			var oBinding = oTable.getBinding("items");
			if (!oBinding) {
				return;
			}
			var aFilters = [];
			// Filter on all possible columns
			if (sQuery) {
				aFilters.push(new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("Transid", sap.ui.model.FilterOperator.Contains, sQuery),
						new sap.ui.model.Filter("ObjValue", sap.ui.model.FilterOperator.Contains, sQuery),
						new sap.ui.model.Filter("FmmDes", sap.ui.model.FilterOperator.Contains, sQuery),
						new sap.ui.model.Filter("ValueOld", sap.ui.model.FilterOperator.Contains, sQuery),
						new sap.ui.model.Filter("Reqname", sap.ui.model.FilterOperator.Contains, sQuery),
						new sap.ui.model.Filter("ValueNew", sap.ui.model.FilterOperator.Contains, sQuery),
						new sap.ui.model.Filter("Approver", sap.ui.model.FilterOperator.Contains, sQuery),
						new sap.ui.model.Filter("Orgfield", sap.ui.model.FilterOperator.Contains, sQuery),
						new sap.ui.model.Filter("Orgvalue", sap.ui.model.FilterOperator.Contains, sQuery)
					],
					and: false
				}));
			}
			oBinding.filter(aFilters, "Application");
		},

		fnCloseSnackbar: function() {
			this.snackbar.close();
		}
	});

});