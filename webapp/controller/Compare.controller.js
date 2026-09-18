sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"MDM_QIR/controller/ErrorHandler"
], function(Controller, ErrorHandler) {
	"use strict";
	var busyDialog = new sap.m.BusyDialog();
	return Controller.extend("MDM_QIR.controller.Compare", {
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
			var vYear = sevenDaysBefore.getFullYear();
			var vTempYear = [];
			var vTempPYear = [];
			for (var i = 0; i < 10; i++) {
				var vPyEar = vYear - 1;
				var oYear = {
					Year: vYear - i
				};
				var PYear = {
					Year: vPyEar - i
				};
				vTempYear.push(oYear);
				vTempPYear.push(PYear);
			}
			var oJsonModelCY = new sap.ui.model.json.JSONModel();
			oJsonModelCY.setData(vTempYear);
			this.getView().setModel(oJsonModelCY, "JMCYear");

			var oJsonModelPY = new sap.ui.model.json.JSONModel();
			oJsonModelPY.setData(vTempPYear);
			this.getView().setModel(oJsonModelPY, "JMPYear");
			sevenDaysBefore.setDate(today.getDate() - 365);

			this.getView().byId("DID_FDATE").setDateValue(sevenDaysBefore);
			this.getView().byId("DID_TDATE").setDateValue(today);
			this.oRouter = this.getOwnerComponent().getRouter(this);
			this.oRouter.getRoute("Compare").attachPatternMatched(this.fnRouter, this);

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
		fnRouter: function() {
			this.fnUsernameGet().then(function(Username) {
				// if (Username !== "" || Username !== undefined) {
				// 	this.fnGetMaster();

				// }
			}.bind(this));

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
						that.fnOverallreq(that.NavOverall);

					});
					oComponent.getApexLoadedPromise().then(function() {
						that.fnDeptWiseRep(that.NavDept);
					});

					oComponent.getApexLoadedPromise().then(function() {
						that.fnFinacialReport(that.NavFYear);
					});
					oComponent.getApexLoadedPromise().then(function() {
						that.fndirectapi(that.NavOverall, that.NavAPI);
					});
					oComponent.getApexLoadedPromise().then(function() {
						that.fnPYear(that.NavPYear);
					});
					oComponent.getApexLoadedPromise().then(function() {
						that.fnCYear(that.NavCYear);
					});
					busyDialog.close();
				}
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
					// var sMessage = ErrorHandler.parseODataError(oResponse);
					// ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
				}
			});

		},
		fnGetYEar: function() {
			var vPyear = this.getView().byId("id_pyear").getSelectedKey();
			var vCyear = this.getView().byId("id_cyear").getSelectedKey();
			if (vPyear === vCyear) {
				sap.m.MessageToast.show("The comparison year should not be the same");
			} else {
				this.fnDataLoad();
			}
		},
		fnSelectDept: function() {
			var vItems = this.getView().byId("id_multiseldept").getSelectedItems();
			var vDept = this.getView().getModel("JMDept").getData();
			var vDeptArray = [];

			vDept.forEach(function(a) {
				var match = vItems.find(function(b) {

					if (a.Dept === b.getKey()) {
						vDeptArray.push(a);
					}
				});

			});

			this.fnDeptWiseRep(vDeptArray);
			//	this.getView().byId("id_multiseldept").getSelectedItems()[0].getKey();
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
				var vSelect = this.getView().byId("id_select").getSelectedKey();
				var vPyear = this.getView().byId("id_pyear").getSelectedKey();
				var vCyear = this.getView().byId("id_cyear").getSelectedKey();
				this.getView().byId("id_pyeartext").setText(vPyear);
				this.getView().byId("id_cyeartext").setText(vCyear);

				var oPayData = {
					AppId: vMaster,
					Fdate: vFDate,
					Tdate: vTDate,
					Sele: vSelect,
					Pyear: vPyear,
					Cyear: vCyear,
					Process: 'C',
					Api: 'X',
					NavOverall: [],
					NavAPI: [],
					NavDept: [],
					NavFYear: [],
					NavPYear: [],
					NavCYear: []
				};
				oModel.create("/Dashboard_HeaderSet", oPayData, {
					success: function(oData) {
						that.NavOverall = oData.NavOverall.results;
						that.NavDept = oData.NavDept.results;
						that.NavFYear = oData.NavFYear.results;
						that.NavAPI = oData.NavAPI.results;
						that.NavPYear = oData.NavPYear.results;
						that.NavCYear = oData.NavCYear.results;

						var oJsonModel = new sap.ui.model.json.JSONModel();
						oJsonModel.setData(oData.NavDept.results);
						that.getView().setModel(oJsonModel, "JMDept");
						var oMultiCombo = that.byId("id_multiseldept");
						var items = oMultiCombo.getItems();
						var keys = [];
						items.forEach(function(item) {
							keys.push(item.getKey());
						});

						oMultiCombo.setSelectedKeys(keys);

						busyDialog.close();
						var PYtotal = oData.NavPYear.results.reduce(function(sum, item) {
							return sum + item.Ncount;
						}, 0);
						var CYtotal = oData.NavCYear.results.reduce(function(sum, item) {
							return sum + item.Ncount;
						}, 0);

						that.getView().byId("id_pyeartotal").setText(PYtotal);
						that.getView().byId("id_cyeartotal").setText(CYtotal);

						that.getView().byId("id_totalavg").setText(oData.NavOverall.results[0].Tavghour + " Hr");
						Resolve(true);
					},
					error: function() {
						busyDialog.close();
						var vError = 'E';
						ErrorHandler.showCustomSnackbar(this.getView().getModel("i18n").getResourceBundle().getText("httprequestfailed"), "Error",this );
						return;
					}
				});
			}.bind(this));

		},
		fnOverallreq: function(oResults) {
			busyDialog.open();
			var vType;

			if (oResults[0].AppId === 'D') {
				vType = 'Day';
			} else if (oResults[0].AppId === 'M') {
				vType = 'Month';
			} else if (oResults[0].AppId === 'W') {
				vType = 'Week';
			} else {
				vType = "";
			}
			var aData = oResults;
			var options = {
				series: [{
					name: 'Hours',
					data: aData.map(function(item) {
						return item.Avghour;
					})
				}],
				chart: {
					type: 'bar',
					height: 221, // Adjusted to match the visual scale
					// width: 500,
					toolbar: {
						show: false // Hides the hamburger menu for a cleaner look
					}
				},
				colors: ['#54BEBD'], // Base teal color
				plotOptions: {
					bar: {
						// Settings for top-only rounding
						borderRadius: 8,
						borderRadiusApplication: 'end', // 'end' ensures only the top of the bar is rounded
						borderRadiusWhenStacked: 'last',
						// Creates the rounded tops seen in your image
						columnWidth: '40%', // Adjusts thickness of the bars
						distributed: false,
						dataLabels: {
							position: 'top'
						}

					}
				},
				// THE GRADIENT ALGORITHM
				fill: {
					type: 'gradient',
					shade: 'light',
					gradient: {
						shadeIntensity: 0.5,
						type: 'vertical',
						gradientToColors: ['#8979FF'],
						inverseColors: false,
						opacityFrom: 1,
						opacityTo: 1,
						stops: [0, 100]
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
						return item.Ndays;
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
					},

					x: {
						formatter: function(value) {
							return vType + " " + value;
						}

					}
				}
			};

			if (this._columnchart) {
				this._columnchart.destroy();
			}

			this._columnchart = new ApexCharts(
				document.querySelector("#idoverallchart"),
				options
			);

			this._columnchart.render();
			busyDialog.close();
		},
		fnDeptWiseRep: function(oResults) {

			var options = {
				series: [{
					name: "Count",

					data: oResults.map(function(item) {
						return item.Ncount;
					})

				}],

				chart: {
					type: 'area', // Use area to get the light color fill under the lines
					height: 85,
					toolbar: {
						show: false
					},
					zoom: {
						enabled: false
					}
				},

				colors: ['#F6AE93'],

				stroke: {
					curve: 'smooth',
					width: 1
				},

				markers: {
					size: 4,
					colors: ['#fff'], // White center
					strokeColors: ['#F6AE93'], // Border matches line color
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
						return item.Dept;
					}),
					labels: {
						style: {
							fontSize: '6px',
							fontFamily: 'Segoe UI Semibold',
							color: '#000000B2'
						}
					},

				},

				grid: {
					borderColor: '#f1f1f1',
					strokeDashArray: 3, // Makes the grid lines dashed like in the screenshot,
					padding: {
						top: -10,
						// bottom: -2

					}
				}
			};
			if (this._linechart) {
				this._linechart.destroy();
			}

			this._linechart = new ApexCharts(
				document.querySelector("#iddeptwise"),
				options
			);

			this._linechart.render();

		},
		fnFinacialReport: function(oResults) {

			var options = {
				chart: {
					type: 'bar',
					height: 80,
					toolbar: {
						show: false
					}
				},
				zoom: {
					enabled: false
				},

				series: [{
					name: 'Average Hour',
					data: oResults.map(function(item) {
						return item.Avghour;
					})
				}],
				plotOptions: {
					bar: {
						horizontal: true,
						barHeight: '70%',
						dataLabels: {
							position: 'right'
						}
					}
				},
				dataLabels: {
					enabled: true,
					formatter: function(val) {
						return val + "hr";
					},
					style: {
						fontSize: '13px',
						colors: ['#000000B2']

					},
					offsetX: 0
				},
				xaxis: {
					position: 'top',
					categories: oResults.map(function(item) {
						return item.Fyear;
					}),
					labels: {
						formatter: function(val) {
							return val + "h";
						},
						style: {
							fontSize: '11px',
							fontFamily: 'Segoe UI Semibold',
							color: '#000000B2'

						}
					}

				},
				yaxis: {
					labels: {

						style: {
							fontSize: '11px',
							fontFamily: 'Segoe UI Semibold',
							color: '#000000B2'

						}
					}
				},

				colors: ['#3393A1'], // Base color
				fill: {
					type: "pattern",
					pattern: {
						style: "verticalLines", // 
						width: 2, // spacing between lines
						height: 2,
						strokeWidth: 0.5 // thickness of lines
					}
				},
				grid: {
					borderColor: "#dcdcdc",
					strokeDashArray: 4,

					padding: {
						top: -18,
						bottom: -27

					}
				}
			};
			if (this.Fchart) {
				this.Fchart.destroy();
			}

			this.Fchart = new ApexCharts(document.querySelector("#idFinacial"), options);
			this.Fchart.render();

		},
		fndirectapi: function(oOverall, oAPI) {
			var vType;

			if (oOverall[0].AppId === 'D') {
				vType = 'Day';
			} else if (oOverall[0].AppId === 'M') {
				vType = 'Month';
			} else if (oOverall[0].AppId === 'W') {
				vType = 'Week';
			} else {
				vType = "";
			}
			var options = {
				series: [{
					name: 'API Request Based',
					data: oAPI.map(function(item) {
						return item.Avghour;
					})
				}, {
					name: 'Direct',
					data: oOverall.map(function(item) {
						return item.Avghour;
					})
				}],
				chart: {
					type: 'bar',
					height: 190,
					stacked: true, // Key property for stacking
					toolbar: {
						show: false
					}
				},
				colors: ['#FF928A', '#3393A1'], // Emerald Green and Peter River Blue
				plotOptions: {
					bar: {
						columnWidth: '50%'
							// borderRadius: 0
					}
				},
				stroke: {
					show: true,
					width: [0, 2],
					colors: ['#FF928A', '#3393A1'] // Manually set darker versions of your teal/blue
				},

				dataLabels: {
					enabled: false
				},

				xaxis: {
					categories: oOverall.map(function(item) {
						return item.Ndays.trim();
					}),
					axisBorder: {
						show: false
					},
					axisTicks: {
						show: false
					},
					style: {
						fontSize: '10px',
						fontFamily: 'Segoe UI Semibold',
						color: '#000000B2'
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
					x: {
						formatter: function(value) {
							return vType + " " + value;
						}
					}
				},

				grid: {
					borderColor: '#f1f1f1',
					strokeDashArray: 3
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
				document.querySelector("#iddirectapi"),
				options
			);

			this._Stackedchart.render();

		},
		fnPYear: function(oResults) {
			var aData = oResults;
			var options = {
				series: [{
					name: 'Count',
					data: aData.map(function(item) {
						return item.Ncount;
					})
				}],
				chart: {
					type: 'bar',
					height: 140, // Adjusted to match the visual scale
					// width: 500,
					toolbar: {
						show: false // Hides the hamburger menu for a cleaner look
					}
				},
				colors: ['#3A9AE5'], // Base teal color

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
						return item.Cmonth;
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
			if (this._Pcolumnchart) {
				this._Pcolumnchart.destroy();
			}
			this._Pcolumnchart = new ApexCharts(
				document.querySelector("#idPreviousYear"),
				options
			);

			this._Pcolumnchart.render();
			//	this._createChart("columnchart", options);
		},
		fnCYear: function(oResults) {
			var aData = oResults;
			var options = {
				series: [{
					name: 'Count',
					data: aData.map(function(item) {
						return item.Ncount;
					})
				}],
				chart: {
					type: 'bar',
					height: 140, // Adjusted to match the visual scale
					// width: 500,
					toolbar: {
						show: false // Hides the hamburger menu for a cleaner look
					}
				},
				colors: ['#2DC381'], // Base teal color

				dataLabels: {
					enabled: false // Hide numbers on top of bars as per screenshot
				},
				grid: {
					borderColor: '#f1f1f1',
					xaxis: {
						lines: {
							show: false
						}

					},
					yaxis: {
						lines: {
							show: true // Kept for the horizontal reference lines

						}
					}
				},
				xaxis: {
					categories: aData.map(function(item) {
						return item.Cmonth;
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
			if (this._Ccolumnchart) {
				this._Ccolumnchart.destroy();
			}
			this._Ccolumnchart = new ApexCharts(
				document.querySelector("#id_cyearchart"),
				options
			);

			this._Ccolumnchart.render();
			//	this._createChart("columnchart", options);
		},

		fnAnalytics: function() {
			this.getOwnerComponent().getRouter().navTo("Analytics");
		},
		fnDashboard: function() {
			this.getOwnerComponent().getRouter().navTo("Dashboard");
		},
		fnDisplaySnackBar: function(MsgType, Message) {
			var vError = this.getView().getModel("i18n").getResourceBundle().getText("Error");
			var vSuccess = this.getView().getModel("i18n").getResourceBundle().getText("Success");
			var vWarning = this.getView().getModel("i18n").getResourceBundle().getText("Warning");
			var vInfo = this.getView().getModel("i18n").getResourceBundle().getText("Info");

			if (!this.snackbar) {
				this.snackbar = sap.ui.xmlfragment("Dashboard.Fragment.Snackbar", this);
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

		fnCloseSnackbar: function() {
			this.snackbar.close();
		}

	});

});