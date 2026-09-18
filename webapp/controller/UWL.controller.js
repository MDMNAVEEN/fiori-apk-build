sap.ui.define([
	"MDM_QIR/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/resource/ResourceModel",
	"MDM_QIR/controller/ErrorHandler",
	"MDM_QIR/Formatter/formatter"
], function(BaseController, Filter, FilterOperator, ResourceModel, ErrorHandler, formatter) {
	"use strict";
	var busyDialog = new sap.m.BusyDialog();
	var i18n;
	return BaseController.extend("MDM_QIR.controller.UWL", {
		formatter: formatter,
		onInit: function() {
			BaseController.prototype.onInit.apply(this, arguments);
			this.vRouter = this.getOwnerComponent().getRouter(this);
			this.vRouter.getRoute("UWL").attachPatternMatched(this.fnRouter, this);

			var vPathImage = jQuery.sap.getModulePath("MDM_QIR") + "/Images/";
			var vImageModel = new sap.ui.model.json.JSONModel({
				path: vPathImage
			});
			this.getView().setModel(vImageModel, "JM_ImageModel");

			var i18nModel = new ResourceModel({
				bundleName: "MDM_QIR.i18n.i18n"
			});
			var oBundle = this.getOwnerComponent()
				.getModel("i18n")
				.getResourceBundle();
			this.getView().setModel(i18nModel, "i18n");
			i18n = this.getView().getModel("i18n").getResourceBundle();
			this.f4Cache = {};

			//added by Naveen Kumar N
			this.getView().byId("id_backbtn").setVisible(false);
			this.getView().byId("id_headtxt").addStyleClass("sapUiLargeMarginBegin");
			var that = this;
			var oConfigModel = this.getOwnerComponent().getModel("JM_Config");
			var oJsonModel = this.getOwnerComponent().getModel("JM_UserModel");
			var columnModel = new sap.ui.model.json.JSONModel({
				columns: [{
					key: "transid",
					label: oBundle.getText("transid_l"),
					visible: true
				}, {
					key: "transreq",
					label: oBundle.getText("TransReq_l"),
					visible: true
				}, {
					key: "sent",
					label: oBundle.getText("sent"),
					visible: true
				}, {
					key: "uid",
					label: oBundle.getText("Userid_l"),
					visible: true
				}, {
					key: "timeleft",
					label: oBundle.getText("OverAllTimeLeft"),
					visible: true
				}]
			});
			this.getView().setModel(columnModel, "JM_ColModel");
			oConfigModel.read("/UsernameSet", {
				success: function(oData) {
					oJsonModel.setData(oData.results);
					that.userName = oData.results[0].Uname;
					that.getOwnerComponent().setModel(oJsonModel, "JM_UserModel");
				},
				error: function(err) {
					ErrorHandler.showCustomSnackbar(i18n.getText("userName_fetch_err"), "Error", that);
					return;
				}
			});

		},
		fnRouter: function() {
			busyDialog.open();
			this.fnSetInitialData();
			// this.getView().byId("id_uwl_h").addStyleClass("cl_listhighlight");
			// this.getView().byId("id_uwl_h").removeStyleClass("cl_list_con");
			// this.getView().byId("id_appList_h").removeStyleClass("cl_listhighlight");
			// this.getView().byId("id_appList_h").addStyleClass("cl_list_con");

			var oConfigModel = this.getOwnerComponent().getModel("JM_Config");
			var oJsonModel = this.getOwnerComponent().getModel("JM_UserModel");

			var that = this;
			oConfigModel.read("/UsernameSet", {
				success: function(oData) {
					oJsonModel.setData(oData.results);
					that.userName = oData.results[0].Uname;
					that.getOwnerComponent().setModel(oJsonModel, "JM_UserModel");
				},
				error: function() {
					ErrorHandler.showCustomSnackbar(i18n.getText("userName_fetch_err"), "Error", that);
				}
			});

			// functionality to get Application table result this filter is used
			var vConfigModel = this.getOwnerComponent().getModel("JM_Config");

			var oView = this.getView();
			oView.setModel(new sap.ui.model.json.JSONModel({
				col1: "",
				col2: ""
			}), "F4Header");
			oView.setModel(new sap.ui.model.json.JSONModel({
				data: []
			}), "JM_F4Help");

			var vPayload = {
				FieldId: "UID_APPID",
				Process: "U",
				F4Type: "F",
				NavSerchResult: []
			};
			vConfigModel.create("/SearchHelpSet", vPayload, {
				success: function(oData) {
					var vModel = new sap.ui.model.json.JSONModel();
					vModel.setData({
						List: oData.NavSerchResult.results
					});
					that.getView().setModel(vModel, "JM_AppId");
				},
				error: function(oResponse) {
					busyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", that);
				}
			});

			// UWL Functionality
			var aFilters = [
				new sap.ui.model.Filter("Appid", "EQ", ""),
				new sap.ui.model.Filter("Userid", "EQ", ""),
				new sap.ui.model.Filter("StartDate", "EQ", this.Date),
				new sap.ui.model.Filter("Transid", "EQ", "")
			];

			vConfigModel.read("/UWLSet", {
				filters: aFilters,
				success: function(oData) {
					var aUwlData = oData.results;
					var recordLength = aUwlData.length;
					that.getView().byId("id_tableRecordCnt").setText("(" + recordLength + ")");
					var oUwlModel = new sap.ui.model.json.JSONModel(aUwlData);
					that.getView().setModel(oUwlModel, "JM_UWL");

					that.fnstartWfTimer(); // Added by srikanth
					busyDialog.close();
				},
				error: function(oResponse) {
					busyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", that);
				}
			});
		},

		// Added by srikanth

		fnstartWfTimer: function() {
			var oTable = this.byId("id_UWLTable");

			if (this._wfTimer) {
				clearInterval(this._wfTimer);
			}

			this._wfTimer = setInterval(function() {
				var aRows = oTable.getRows();

				aRows.forEach(function(oRow) {
					var oCtx = oRow.getBindingContext("JM_UWL");
					if (!oCtx) {
						return;
					}

					var oData = oCtx.getObject();

					oCtx.getModel().setProperty(
						oCtx.getPath() + "/WfTimerText",
						""
					);

					// validation
					if (!oData.WfHours || (oData.WfHours.ms <= 0 && oData.WfDays <= 0)) {
						return;
					}

					var iTotalMs =
						(oData.WfDays * 24 * 60 * 60 * 1000) +
						oData.WfHours.ms;

					if (iTotalMs <= 0) {
						return;
					}

					iTotalMs = Math.max(0, iTotalMs - 1000);

					var iDayMs = 24 * 60 * 60 * 1000;
					var iDays = Math.floor(iTotalMs / iDayMs);
					var iRemainingMs = iTotalMs % iDayMs;

					var iSeconds = Math.floor(iRemainingMs / 1000);
					var h = Math.floor(iSeconds / 3600);
					var m = Math.floor((iSeconds % 3600) / 60);
					var s = iSeconds % 60;

					oData.WfDays = iDays;
					oData.WfHours.ms = iRemainingMs;

					var sFinal =
						iDays + "<strong>D</strong> : " +
						h.toString().padStart(2, "0") + " : " +
						m.toString().padStart(2, "0") + " : " +
						s.toString().padStart(2, "0");

					oCtx.getModel().setProperty(oCtx.getPath() + "/WfTimerText", sFinal);
				});

			}, 1000);
		},

		onExit: function() {
			if (this._wfTimer) {
				clearInterval(this._wfTimer);
			}
		},

		// EOC
		fnSetInitialData: function() {
			var today = new Date();
			var toDate = new Date(today);
			var fromDate = new Date(today);
			fromDate.setDate(fromDate.getDate() - 7);

			function fnFormatDate(date) {
				var yyyy = date.getFullYear();
				var mm = String(date.getMonth() + 1).padStart(2, '0');
				var dd = String(date.getDate()).padStart(2, '0');
				return yyyy + mm + dd;
			}
			this.Date = fnFormatDate(fromDate) + "-" + fnFormatDate(toDate);
			var oDateRange = this.byId("UID_RDATE");
			if (oDateRange) {
				oDateRange.setDateValue(fromDate); // Start date
				oDateRange.setSecondDateValue(toDate); // End date
			}
		},
		fnAppIdSelect: function(oEvent) {
			this.vAppId = oEvent.getSource().getSelectedKey();
		},
		fnDateDropDown: function(oEvent) {
			var oSelectedKey = oEvent.getSource().getSelectedKey();
			var oDateRange = this.byId("UID_RDATE");
			var today = new Date();
			var fromDate, toDate;
			switch (oSelectedKey) {
				case "CY": // Current Year
					fromDate = new Date(today.getFullYear(), 0, 1);
					toDate = new Date(today);
					break;
				case "CFY": // Current Financial Year (Apr 1 - Mar 31)
					if (today.getMonth() >= 3) {
						fromDate = new Date(today.getFullYear(), 3, 1);
						toDate = new Date(today.getFullYear() + 1, 2, 31);
					} else {
						fromDate = new Date(today.getFullYear() - 1, 3, 1);
						toDate = new Date(today.getFullYear(), 2, 31);
					}
					break;
				case "PFY": // Previous Financial Year
					if (today.getMonth() >= 3) {
						fromDate = new Date(today.getFullYear() - 1, 3, 1);
						toDate = new Date(today.getFullYear(), 2, 31);
					} else {
						fromDate = new Date(today.getFullYear() - 2, 3, 1);
						toDate = new Date(today.getFullYear() - 1, 2, 31);
					}
					break;
				case "HY":
					fromDate = new Date(today);
					fromDate.setMonth(today.getMonth() - 6);
					toDate = new Date(today);
					break;
				case "ANN":
					fromDate = new Date(today);
					fromDate.setFullYear(today.getFullYear() - 1);
					toDate = new Date(today);
					break;
				case "QTR2": // Apr 1 – Jun 30
					fromDate = new Date(today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1, 3, 1);
					toDate = new Date(fromDate.getFullYear(), 5, 30);
					break;
				case "QTR3": // Jul 1 – Sep 30
					fromDate = new Date(today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1, 6, 1);
					toDate = new Date(fromDate.getFullYear(), 8, 30);
					break;
				case "QTR4": // Oct 1 – Dec 31
					fromDate = new Date(today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1, 9, 1);
					toDate = new Date(fromDate.getFullYear(), 11, 31);
					break;
				case "QTR1": // Jan 1 – Mar 31
					fromDate = new Date(today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear(), 0, 1);
					toDate = new Date(fromDate.getFullYear(), 2, 31);
					break;
			}
			// Set date range
			oDateRange.setDateValue(fromDate);
			oDateRange.setSecondDateValue(toDate);
		},
		/****************************SearchHelp and LiveChange Functionalities(Start)*******************************************/
		fnF4press: function(oEvent) {
			var that = this;
			var vitem = oEvent.getSource().getId().split("--")[1];
			this.selectedField = vitem;
			var vF4Type = "P";

			var vPayload = {
				FieldId: vitem,
				Process: "U",
				F4Type: vF4Type,
				NavSerchResult: []
			};
			var vModel = this.getOwnerComponent().getModel("JM_Config");
			var vLabels = {};
			var vJsonModel;
			var vTitle;
			var vLength;
			var aFormattedRows = [];
			vModel.create("/SearchHelpSet", vPayload, {
				success: function(oData) {
					var aResults = oData.NavSerchResult.results;
					if (aResults.length > 0) {
						var oFirst = aResults[0];
						vLength = oData.NavSerchResult.results.length;
						if (oFirst.MsgType === "I" || oFirst.MsgType === "E") {
							ErrorHandler.showCustomSnackbar(oFirst.Message, "Error", that);

							return;
						}
						if (vF4Type === "F") {
							vLabels.col1 = "Key";
							if (oFirst.Label2) {
								vLabels.col2 = oFirst.Label2;
							}
							aResults.forEach(function(item) {
								var row = {};
								if (vLabels.col1) {
									row.col1 = item.DomvalueL;
								}
								if (vLabels.col2) {
									row.col2 = item.Ddtext;
								}
								aFormattedRows.push(row);
							});
							vJsonModel = new sap.ui.model.json.JSONModel({
								labels: vLabels,
								rows: aFormattedRows
							});
							that.getView().setModel(vJsonModel, "JM_F4Model");
							that.getView().getModel("JM_F4Model");
							vTitle = that.getView().getModel("JM_F4Model").getData().labels.col1 + " (" + vLength + ")";
							that.fnF4fragopen(oEvent, vTitle).open();
						} else {
							if (oFirst.Label1) {
								vLabels.col1 = oFirst.Label1;
							}
							if (oFirst.Label2) {
								vLabels.col2 = oFirst.Label2;
							}
							if (oFirst.Label3) {
								vLabels.col3 = oFirst.Label3;
							}
							if (oFirst.Label4) {
								vLabels.col4 = oFirst.Label4;
							}

							aResults.forEach(function(item) {
								var row = {};
								if (vLabels.col1) {
									row.col1 = item.Value1;
								}
								if (vLabels.col2) {
									row.col2 = item.Value2;
								}
								if (vLabels.col3) {
									row.col3 = item.Value3;
								}
								if (vLabels.col4) {
									row.col4 = item.Value4;
								}
								aFormattedRows.push(row);
							});

							vJsonModel = new sap.ui.model.json.JSONModel({
								labels: vLabels,
								rows: aFormattedRows
							});
							that.getView().setModel(vJsonModel, "JM_F4Model");
							that.getView().getModel("JM_F4Model");
							vTitle = that.getView().getModel("JM_F4Model").getData().labels.col1 + " (" + vLength + ")";
							that.fnF4fragopen(oEvent, vTitle).open();
						}
					}
				},
				error: function(oResponse) {
					ErrorHandler.showCustomSnackbar(oResponse.message, "Error", this);
				}
			});
		},
		fnF4fragopen: function(oEvent, vTitle) {
			if (!this.f4HelpFrag) {
				this.f4HelpFrag = sap.ui.xmlfragment(this.getView().getId(), "MDM_QIR.Fragments.F4Help", this);
				this.getView().addDependent(this.f4HelpFrag);
			}
			this.f4HelpFrag.setTitle(vTitle);
			return this.f4HelpFrag;
		},
		fnF4Itempress: function(oEvent) {
			var vItem = oEvent.getSource();
			var vContext = vItem.getBindingContext("JM_F4Model");
			if (!vContext) {
				return;
			}

			var item = vContext.getProperty("col1");
			this.getView().byId(this.selectedField).setValue(item);

			this.fnf4HelpCancel();
		},
		fnValueSearch: function(oEvent) {
			var vInput = oEvent.getSource();
			var vValue = vInput.getValue().toUpperCase();
			vInput.setValue(vValue);
			var vTable = this.byId("id_SearchHelp");
			var vBinding = vTable.getBinding("items");
			if (!vBinding) return;

			var vFilters = [];
			if (vValue) {
				vFilters.push(new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("col1", sap.ui.model.FilterOperator.StartsWith, vValue),
						new sap.ui.model.Filter("col2", sap.ui.model.FilterOperator.StartsWith, vValue),
						new sap.ui.model.Filter("col3", sap.ui.model.FilterOperator.StartsWith, vValue),
						new sap.ui.model.Filter("col4", sap.ui.model.FilterOperator.StartsWith, vValue)
					],
					and: false
				}));
			}

			vBinding.filter(vFilters, "Application");
		},
		fnf4HelpCancel: function(oEvent) {
			this.fnF4fragopen().close();
			this.f4HelpFrag.destroy();
			this.f4HelpFrag = null;
		},
		fnLiveChange: function(oEvent) {
			var vValue = oEvent.getParameter("value");
			var vUpper = vValue.toUpperCase();
			oEvent.getSource().setValue(vUpper);
		},
		/********************************* Search Fucntionality (Start)*****************************************************/
		fnFormatDate: function(date) {
			var yyyy = date.getFullYear();
			var mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
			var dd = String(date.getDate()).padStart(2, "0");
			return yyyy + mm + dd;
		},
		fnUWLSearch: function() {
			busyDialog.open();
			var that = this;
			var vAppId = this.getView().byId("UID_APPID").getValue();
			var vDateRange = this.getView().byId("UID_RDATE");
			var dFromDate = vDateRange.getDateValue();
			var dToDate = vDateRange.getSecondDateValue();

			if (dFromDate && dToDate) {
				var vFormattedDate =
					this.fnFormatDate(dFromDate) + "-" + this.fnFormatDate(dToDate);
			} else {
				vFormattedDate = null;
			}

			var vTransId = this.getView().byId("UID_TRANSID").getValue();
			var vUserId = this.getView().byId("UID_USERID").getValue();
			if (!vAppId && !vDateRange && !vTransId && !vUserId) {
				ErrorHandler.showCustomSnackbar("Please fill atleast one criteria to Search", "Error", this);
				return;
			}
			var vFilters = [
				new Filter("Appid", FilterOperator.EQ, this.vAppId),
				new Filter("Transid", FilterOperator.EQ, vTransId),
				new Filter("Userid", FilterOperator.EQ, vUserId),
				new Filter("StartDate", FilterOperator.EQ, vFormattedDate)
			];
			var vConfigModel = this.getOwnerComponent().getModel("JM_Config");
			vConfigModel.read("/UWLSet", {
				filters: [vFilters],
				success: function(oData) {
					var vUwlData = oData.results;
					var recordLength = vUwlData.length;
					that.getView().byId("id_tableRecordCnt").setText("(" + recordLength + ")");
					var vUwlModel = new sap.ui.model.json.JSONModel();
					vUwlModel.setData(vUwlData); // Wrap in 'results' for table binding
					that.getView().setModel(vUwlModel, "JM_UWL");
					busyDialog.close();
				},
				error: function(oResponse) {
					busyDialog.close();
					var vMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(vMessage, "Error", that);
				}
			});
		},
		/********************************* Search Fucntionality (End)*****************************************************/

		fnTransidPress: function(oEvent) {
			var vGlobalData = this.getView().getModel("JM_UWL").getData();
			var vSelectedIndex = oEvent.getSource().getBindingContext("JM_UWL").sPath.split("/")[1];
			var vTransId = vGlobalData[vSelectedIndex].Transid;
			var vWorkItemId = vGlobalData[vSelectedIndex].WiId;
			var vTypeLevel = vGlobalData[vSelectedIndex].TypeLvl;
			var vSendBack = vGlobalData[vSelectedIndex].SendBackInd;
			var vAppId = vGlobalData[vSelectedIndex].Appid;
			// var vProcessModel = this.getOwnerComponent().getModel("JM_processModel");
			// if (!vProcessModel) {
			// 	vProcessModel = new sap.ui.model.json.JSONModel({
			// 		Role: "",
			// 		Vendor: true,
			// 		Customer: false
			// 	}); Commented By Naveen
			// this.getOwnerComponent().setModel(vProcessModel, "JM_processModel"); Commented By Naveen
			//	}
			if (vGlobalData[vSelectedIndex].Appid === "QIRC" || vGlobalData[vSelectedIndex].Appid === "QIRX") {
				// if (vTypeLevel === "R" || vTypeLevel === "A") {  // commented by srikanth
				var jsonData = {
					Appid: vAppId,
					Transid: vTransId,
					Ind: "X",
					MsgType: "D",
					WiId: vWorkItemId,
					TypeLevel: vTypeLevel,
					SendBack: vSendBack // Added by srikanth
				};
				var vParmModel = new sap.ui.model.json.JSONModel(jsonData);
				this.getOwnerComponent().setModel(vParmModel, "JM_ContextModel");
				var vViewstateModel = new sap.ui.model.json.JSONModel({
					fromDashboard: false,
					fromUWL: true,
					fromKeyData: false
				});
				// this.getOwnerComponent().setModel(vViewstateModel, "JM_ViewStateModel");
				// vProcessModel.setProperty("/Role", "Vendor");
				// vProcessModel.setProperty("/Vendor", true);
				// vProcessModel.setProperty("/Customer", false); Commented By Naveen

				// sap.ui.core.UIComponent.getRouterFor(this).navTo("Initiator");
				// } 
				// } else if (vGlobalData[vSelectedIndex].Appid === "CC") {
				// 	// if (vTypeLevel === "R" || vTypeLevel === "A") {
				// 	var jsonData = {
				// 		Appid: vAppId,
				// 		Transid: vTransId,
				// 		Ind: "X",
				// 		MsgType: "D",
				// 		WiId: vWorkItemId,
				// 		TypeLevel: vTypeLevel,
				// 		SendBack: vSendBack // Added by srikanth
				// 	};
				// 	vParmModel = new sap.ui.model.json.JSONModel(jsonData);
				// 	this.getOwnerComponent().setModel(vParmModel, "JM_ContextModel");
				// 	vViewstateModel = new sap.ui.model.json.JSONModel({
				// 		fromDashboard: false,
				// 		fromUWL: true,
				// 		fromKeyData: false,

				// 	}); // Commented By Naveen Kumar N
				this.getOwnerComponent().setModel(vViewstateModel, "JM_ViewStateModel");
				// vProcessModel.setProperty("/Role", "Customer");
				// vProcessModel.setProperty("/Vendor", false);
				// vProcessModel.setProperty("/Customer", true); Commented By Naveen
				sap.ui.core.UIComponent.getRouterFor(this).navTo("Initiator");
			} else if (vGlobalData[vSelectedIndex].Appid === "QIRMC" || vGlobalData[vSelectedIndex].Appid === "QIRMX") {
				// if (vTypeLevel === "R" || vTypeLevel === "A") {  // commented by srikanth
				var jsonData = {
					Appid: vAppId,
					Transid: vTransId,
					Ind: "X",
					MsgType: "D",
					WiId: vWorkItemId,
					TypeLevel: vTypeLevel,
					SendBack: vSendBack // Added by srikanth
				};
				var vParmModel = new sap.ui.model.json.JSONModel(jsonData);
				this.getOwnerComponent().setModel(vParmModel, "JM_ContextModel");
				var vViewstateModel = new sap.ui.model.json.JSONModel({
					fromDashboard: false,
					fromUWL: true,
					fromKeyData: false
				});
				// this.getOwnerComponent().setModel(vViewstateModel, "JM_ViewStateModel");
				// vProcessModel.setProperty("/Role", "Vendor");
				// vProcessModel.setProperty("/Vendor", true);
				// vProcessModel.setProperty("/Customer", false); Commented By Naveen

				// sap.ui.core.UIComponent.getRouterFor(this).navTo("Initiator");
				// } 
				// } else if (vGlobalData[vSelectedIndex].Appid === "CC") {
				// 	// if (vTypeLevel === "R" || vTypeLevel === "A") {
				// 	var jsonData = {
				// 		Appid: vAppId,
				// 		Transid: vTransId,
				// 		Ind: "X",
				// 		MsgType: "D",
				// 		WiId: vWorkItemId,
				// 		TypeLevel: vTypeLevel,
				// 		SendBack: vSendBack // Added by srikanth
				// 	};
				// 	vParmModel = new sap.ui.model.json.JSONModel(jsonData);
				// 	this.getOwnerComponent().setModel(vParmModel, "JM_ContextModel");
				// 	vViewstateModel = new sap.ui.model.json.JSONModel({
				// 		fromDashboard: false,
				// 		fromUWL: true,
				// 		fromKeyData: false,

				// 	}); // Commented By Naveen Kumar N
				this.getOwnerComponent().setModel(vViewstateModel, "JM_ViewStateModel");
				// vProcessModel.setProperty("/Role", "Customer");
				// vProcessModel.setProperty("/Vendor", false);
				// vProcessModel.setProperty("/Customer", true); Commented By Naveen
				if (vAppId === "QIRMC") {
					sap.ui.core.UIComponent.getRouterFor(this).navTo("MassCreate");
				} else if (vAppId === "QIRMX") {
					sap.ui.core.UIComponent.getRouterFor(this).navTo("MassChange");
				}
			}
			// }
		},

		/****************************SearchHelp and LiveChange Functionalities(End)*******************************************/
		fnNavigateToView: function(oEvent) {
			var id = oEvent.getSource().getId().split("--")[1];
			if (id === "id_uwl") {
				sap.ui.core.UIComponent.getRouterFor(this).navTo("UWL");
			}
			if (id === "id_bp") {
				sap.ui.core.UIComponent.getRouterFor(this).navTo("Search");
			}
			if (id === "id_dashBoard") {
				sap.ui.core.UIComponent.getRouterFor(this).navTo("Dashboard");
			}
			if (id === "id_workFlow") {
				// Absolute URL of the deployed app
				sap.m.URLHelper.redirect(
					"http://hd1sap.exalca.com:8000/sap/bc/ui5_ui5/sap/zmdm_search/webapp/index.html?sap-client=300&sap-ui-language=EN&sap-ui-xx-devmode=true",
					false);
			}
			if (id === "id_RulesEngine") {
				sap.m.URLHelper.redirect(
					"http://hd1sap.exalca.com:8000/sap/bc/ui5_ui5/sap/zmaintain_rules/webapp/index.html?sap-client=300&sap-ui-language=EN&sap-ui-xx-devmode=true",
					false);
			}
		},

		fn_openpopover: function(oEvent) {
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment(
					this.getView().getId(),
					"MDM_QIR.Fragments.Popover",
					this
				);
				this.getView().addDependent(this._oPopover);
			}

			this._oPopover.openBy(oEvent.getSource());
		},
		fn_CustomizeColumns: function() {

			if (!this._oColDialog) {
				this._oColDialog = sap.ui.xmlfragment(
					this.getView().getId(),
					"MDM_QIR.Fragments.CustomizeColumns",
					this
				);
				this.getView().addDependent(this._oColDialog);
			}

			var oOriginalModel = this.getView().getModel("JM_ColModel");
			var aOriginalData = JSON.parse(JSON.stringify(oOriginalModel.getProperty("/columns")));

			var oTempModel = new sap.ui.model.json.JSONModel({
				columns: aOriginalData
			});

			this.getView().setModel(oTempModel, "JM_TempColModel");

			this._oColDialog.open();
		},
		// fn_CustomizeColumns: function() {
		// 	sap.ui.core.BusyIndicator.show(0);

		// 	if (!this._oColDialog) {
		// 		this._oColDialog = sap.ui.xmlfragment(
		// 			this.getView().getId(),
		// 			"MDM_QIR.Fragments.CustomizeColumns",
		// 			this
		// 		);
		// 		this.getView().addDependent(this._oColDialog);
		// 	}

		// 	this._oColDialog.open();

		// 	if (!this._bColumnsInitialized) {
		// 		this._bColumnsInitialized = true;

		// 		setTimeout(function() {
		// 			var oTable = this.byId("idCustomizeTable");
		// 			if (oTable) {
		// 				oTable.selectAll();
		// 			}
		// 		}.bind(this), 100);
		// 	}

		// 	sap.ui.core.BusyIndicator.hide();
		// },
		// fn_SelectAll: function(oEvent) {
		// 	var bSelected = oEvent.getParameter("selected");
		// 	var oTable = this.byId("idCustomizeTable");

		// 	if (bSelected) {
		// 		oTable.selectAll();
		// 	} else {
		// 		oTable.clearSelection();
		// 	}

		// 	var oModel = this.getView().getModel("JM_ColModel");
		// 	var aCols = oModel.getProperty("/columns");

		// 	aCols.forEach(function(oCol) {
		// 		oCol.visible = bSelected;
		// 	});

		// 	oModel.refresh(true);

		// },
		fn_SelectAllList: function(oEvent) {

			var bSelected = oEvent.getParameter("selected");
			var oModel = this.getView().getModel("JM_TempColModel");
			var aCols = oModel.getProperty("/columns");

			aCols.forEach(function(oCol) {
				oCol.visible = bSelected;
			});

			oModel.refresh(true);
		},
		fn_SearchColumns: function(oEvent) {

			var sValue = oEvent.getParameter("newValue") || oEvent.getParameter("query");

			var oList = this.byId("idCustomizeList");
			var oBinding = oList.getBinding("items");

			if (!oBinding) return;

			if (!sValue) {
				oBinding.filter([]);
				return;
			}

			var oFilter = new sap.ui.model.Filter(
				"label",
				sap.ui.model.FilterOperator.Contains,
				sValue
			);

			oBinding.filter([oFilter]);
		},
		fn_ApplyColumns: function() {

			var oTempModel = this.getView().getModel("JM_TempColModel");
			var aTempCols = oTempModel.getProperty("/columns");

			var bAtLeastOne = aTempCols.some(function(col) {
				return col.visible;
			});

			if (!bAtLeastOne) {
				ErrorHandler.showCustomSnackbar(i18n.getText("Column_Select_Error"), "Error", this);
				return;
			}

			var oMainModel = this.getView().getModel("JM_ColModel");
			oMainModel.setProperty("/columns", aTempCols);

			oMainModel.refresh(true);

			// this.fn_applyColumnWidthLogic();
			// this._adjustColumnWidth();

			this._oColDialog.close();
		},
		fn_CloseCustomize: function() {
			this._oColDialog.close();
		},
		fn_ToggleWrapText: function() {

			var oViewModel = this.getView().getModel("view");
			var bWrap = oViewModel.getProperty("/wrapText");

			oViewModel.setProperty("/wrapText", !bWrap);
			if (!bWrap) {
				this.byId("id_wraptext").setText("Clip Text");
			} else {
				this.byId("id_wraptext").setText("Wrap Text");
			}

			if (this._oPopover) {
				this._oPopover.close();
			}
		},
		fn_OpenCustomizeColumns: function() {

			if (this._oPopover) {
				this._oPopover.close();
			}

			this.fn_CustomizeColumns();
		},

	});

});