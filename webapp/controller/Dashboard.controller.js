sap.ui.define([
	"MDM_QIR/controller/BaseController",
	"MDM_QIR/Formatter/formatter",
	"MDM_QIR/controller/ErrorHandler",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Filter"

], function(BaseController, formatter, ErrorHandler, FilterOperator, Filter) {
	"use strict";
	var busyDialog = new sap.m.BusyDialog();
	return BaseController.extend("MDM_QIR.controller.Dashboard", {

		onInit: function() {
			BaseController.prototype.onInit.apply(this, arguments);
			var vPathImage = jQuery.sap.getModulePath("MDM_QIR") + "/Images/";
			var oImageModel = new sap.ui.model.json.JSONModel({
				path: vPathImage
			});
			this.getView().setModel(oImageModel, "JM_ImageModel");

			var oVisible = {
				Expand: true,
				Drop: false,
				Visible: false,
				Image: this._getImagePath("DBFilter.svg"),
				DBExpand: this._getImagePath("DBExpand.svg"),
				BtnText: "Filter",
				AdvSearch: false,
				AdvBtn: false,
				Enable: false,
				CheckBox: "4%",
				Level: "5%",
				Status: "11.5%",
				TransId: "9%",
				Application: "11%",
				Code: "10%",
				Description: "10%",
				SDate: "7%",
				EDate: "7%",
				User: "7%",
				TLeft: "9%",
				Overall: "10.5%",
				Dashboard: "Dashboard",
				Analytics: "Analytics",
				Compare: "Compare"

			};
			if (sap.ui.Device.system.phone) {
				oVisible.Dashboard = "";
				oVisible.Analytics = "";
				oVisible.Compare = "";
			}
			var oJsonModel = new sap.ui.model.json.JSONModel();
			oJsonModel.setData(oVisible);

			this.getView().setModel(oJsonModel, "JMVisiblity");

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
			sevenDaysBefore.setDate(today.getDate() - 7);

			this.getView().byId("DID_FDATE").setDateValue(sevenDaysBefore);
			this.getView().byId("DID_TDATE").setDateValue(today);
			this.oRouter = this.getOwnerComponent().getRouter(this);
			this.oRouter.getRoute("Dashboard").attachPatternMatched(this.fnRouter, this);

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
			this.fnReadValue();

		},
		_getImagePath: function(sFile) {
			return this.getView().getModel("JM_ImageModel").getProperty("/path") + sFile;
		},
		fnFilterDisplay: function() {
			var vData = this.getView().getModel("JMVisiblity").getData().Visible;
			this.getView().getModel("JMVisiblity").getData().Visible = !vData;
			if (vData) {
				this.getView().getModel("JMVisiblity").getData().Image = this._getImagePath("DBFilter.svg");
				this.getView().getModel("JMVisiblity").getData().BtnText = "Filter";
				this.getView().getModel("JMVisiblity").getData().AdvBtn = false;
				this.getView().getModel("JMVisiblity").getData().AdvSearch = false;

			} else {
				this.getView().getModel("JMVisiblity").getData().Image = "sap-icon://decline";
				this.getView().getModel("JMVisiblity").getData().BtnText = "Close Filter";
				this.getView().getModel("JMVisiblity").getData().AdvBtn = true;
				this.getView().getModel("JMVisiblity").getData().AdvSearch = false;
			}
			this.getView().getModel("JMVisiblity").updateBindings(true);
		},
		fnAdvanceSearch: function() {
			var vData = this.getView().getModel("JMVisiblity").getData().AdvSearch;
			this.getView().getModel("JMVisiblity").getData().AdvSearch = !vData;
			this.getView().getModel("JMVisiblity").getData().AdvBtn = vData;
			this.getView().getModel("JMVisiblity").updateBindings(true);
		},
		fnRouter: function() {
			this.fnUsernameGet().then(function(Username) {
				if (Username !== "" || Username !== undefined) {
					this.fnGetMaster();

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
						this.fnOdataCallforStatus();
						//	var uname = oData.results[0].Agent;
						//	this.getView().byId("DID_AGENT").setValue(uname);
						busyDialog.close();
					}.bind(this),
					error: function(oResponse) {
						Reject(undefined);
						busyDialog.close();
						var vError = 'E';
						// var vErrorMsg = this.getView().getModel("i18n").getResourceBundle().getText("httprequestfailed");
						// this.fnDisplaySnackBar(vError, vErrorMsg);
						ErrorHandler.showCustomSnackbar(this.getView().getModel("i18n").getResourceBundle().getText("httprequestfailed"), "Error",
							this);
						return;
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

					that.fnGetData(results[0].DomvalueL);

				},
				error: function(oResponse) {
					busyDialog.close();
					var vError = 'E';
					// var vErrorMsg = this.getView().getModel("i18n").getResourceBundle().getText("httprequestfailed");
					// this.fnDisplaySnackBar(vError, vErrorMsg);
					ErrorHandler.showCustomSnackbar(this.getView().getModel("i18n").getResourceBundle().getText("httprequestfailed"), "Error",
						this);
					return;
				}
			});

		},
		fnOdataCallforStatus: function() {
			var oPayload = {
				FieldId: "DID_STATUS",
				Process: "D",
				F4Type: "F"
			};
			oPayload.NavSerchResult = [];

			var omodel1 = this.getOwnerComponent().getModel("JM_Config");
			omodel1.setUseBatch(false);
			busyDialog.open();
			omodel1.create("/SearchHelpSet", oPayload, {
				success: function(odata) {
					var aResults = odata.NavSerchResult.results;
					aResults.push({
						Ddtext: "All",
						DomvalueL: ""
					});
					var oJsonModel = new sap.ui.model.json.JSONModel();
					oJsonModel.setData(aResults);
					this.getView().setModel(oJsonModel, "JMStatus");
					this.getView().byId("DID_STATUS").setSelectedKey("");
				}.bind(this),
				error: function(oResponse) {
					busyDialog.close();
					var vError = 'E';
					// var vErrorMsg = this.getView().getModel("i18n").getResourceBundle().getText("httprequestfailed");
					// this.fnDisplaySnackBar(vError, vErrorMsg);
					ErrorHandler.showCustomSnackbar(this.getView().getModel("i18n").getResourceBundle().getText("httprequestfailed"), "Error",
						this);
					return;
				}
			});
		},
		fnReadValue: function() {
			this.CurrentPage = 1;
			var vMaster = this.getView().byId("UID_APPID").getSelectedKey();
			this.fnGetData(vMaster);
		},

		fnGetData: function(Value) {
			var oModel = this.getView().getModel("JM_Config");
			busyDialog.open();
			var that = this;
			var vMaster = Value;
			// var vMaster = this.getView().byId("UID_APPID").getSelectedKey();
			var vFDate = that.getView().byId("DID_FDATE").getValue();
			var vTDate = that.getView().byId("DID_TDATE").getValue();
			var oPayData = {
				AppId: vMaster,
				Fdate: vFDate,
				Tdate: vTDate,
				Sele: 'D',
				NavReqCount: []
			};
			oModel.create("/Dashboard_HeaderSet", oPayData, {
				success: function(oData) {
					busyDialog.close();
					var oJsonModel = new sap.ui.model.json.JSONModel();
					oJsonModel.setData(oData.NavReqCount.results[0]);

					that.getView().setModel(oJsonModel, "JMReqCount");
					that.fngetSearch(0, 0);

				},
				error: function() {
					busyDialog.close();
					var vError = 'E';
					// var vErrorMsg = this.getView().getModel("i18n").getResourceBundle().getText("httprequestfailed");
					// this.fnDisplaySnackBar(vError, vErrorMsg);
					ErrorHandler.showCustomSnackbar(this.getView().getModel("i18n").getResourceBundle().getText("httprequestfailed"), "Error",
						this);
					return;
				}
			});

		},
		fnFieldSel: function(oEvent) {
			if (!oEvent.getSource().getSelected()) {
				oEvent.getSource().removeStyleClass('cl_checkboxSel');
				oEvent.getSource().addStyleClass('cl_checkbox');
			} else {

				oEvent.getSource().removeStyleClass('cl_checkbox');
				oEvent.getSource().addStyleClass('cl_checkboxSel');

			}
		},
		fngetSearch: function(Top, Skip) {
			var that = this;
			var iTop = Top;
			var iSkip = Skip;
			var sStatus = this.getView().byId("DID_STATUS").getSelectedKey();
			var oModel = this.getView().getModel("JM_Config");
			var vObject = "";
			var ObjValue = this.getView().byId("DID_OBJVAL");
			if (ObjValue !== undefined) {
				vObject = ObjValue.getValue();
			}
			var vMasterValue = this.getView().byId("UID_APPID").getSelectedKey();

			var vValue = this.getView().byId("ID_MDM_APPID").getValue();
			if (vValue) {
				vValue = vValue.split('-')[0];
			} else {
				vValue = vMasterValue;
			}

			this.oPayload = {
				Transid: this.getView().byId("DID_TRANS_ID").getValue(),
				AppId: vValue,
				UserId: this.getView().byId("DID_AGENT").getValue(),
				StartDate: this.getView().byId("DID_FDATE").getValue() || null,
				EndDate: this.getView().byId("DID_TDATE").getValue() || null,
				Status: sStatus,
				ObjValue: vObject,
				Top: iTop,
				Skip: iSkip,

				NavDashTab: [],
				NavDashLvl: []
			};

			if (this._dynamicInputIds) {
				this._dynamicInputIds.forEach(function(id, index) {
					var oInput = that.getView().byId(id);
					if (oInput) {
						that.oPayload["WfParm" + (index + 1)] = oInput.getValue();
					}
				});
			}

			busyDialog.open();
			oModel.create("/DashboardSet", this.oPayload, {
				success: function(oData) {
					var oJsonModel = new sap.ui.model.json.JSONModel();
					var aResults = oData.NavDashTab.results;
					// oJsonModel.setSizeLimit(aResults.length);
					oJsonModel.setData(aResults);
					that.getView().setModel(oJsonModel, "JM_DASHBOARD");
					that.getView().byId("id_toatlcount").setText(oData.TotalCount);
					var oGetModel = that.getView().getModel("JM_DASHBOARD");
					var aItems = oGetModel.getProperty("/");
					that.fnstartWfTimerDirectId();
					var oFullLevelData = oData.NavDashLvl.results;

					aItems.forEach(function(oItem) {
						oItem.Drop = false;
						oItem.Select = false;
						oItem._FilteredLevelData = [];

					});

					var vPageCount = Math.ceil(oData.TotalCount / 250);
					if (that.CurrentPage === undefined) {
						that.CurrentPage = 1;
					}
					that.getView().byId("DID_PAGEDET").setText("Page " + that.CurrentPage + " of " + vPageCount);
					if (vPageCount > 1) {
						that.getView().byId("DID_NEXT").setEnabled(true);
					}
					if (that.CurrentPage > 1) {
						that.getView().byId("DID_PREVIOUS").setEnabled(true);
					} else {
						that.getView().byId("DID_PREVIOUS").setEnabled(false);
					}
					var oDashLevelModel = new sap.ui.model.json.JSONModel({
						LevelData: oData.NavDashLvl.results || []
					});
					that.getView().setModel(oDashLevelModel, "LevelModel");

					busyDialog.close();
				},
				error: function(oResponse) {
					busyDialog.close();
					var vError = 'E';
					// var vErrorMsg = this.getView().getModel("i18n").getResourceBundle().getText("httprequestfailed");
					// this.fnDisplaySnackBar(vError, vErrorMsg);
					ErrorHandler.showCustomSnackbar(this.getView().getModel("i18n").getResourceBundle().getText("httprequestfailed"), "Error",
						this);
					return;

				}
			});
		},
		fnDisplayAll: function() {
			var vRead = this.getView().getModel("JMVisiblity").getData();
			var vValue = !vRead.Drop;

			busyDialog.open();

			var vData = this.getView().getModel("JM_DASHBOARD").getData();
			var oFullLevelData = this.getView().getModel("LevelModel").getProperty("/LevelData") || [];

			for (var i = 0; i < vData.length; i++) {
				vData[i].Drop = vValue;
				if (vValue) {
					this.getView().byId("id_List").getItems()[i].getContent()[0].getItems()[1].getItems()[0].setSrc(this._getImagePath("arrowup.svg"));
				} else {
					this.getView().byId("id_List").getItems()[i].getContent()[0].getItems()[1].getItems()[0].setSrc(this._getImagePath(
						"DBDropDown.svg"));

				}
				if (vValue) {
					vData[i]._FilteredLevelData = oFullLevelData.filter(function(entry) {
						return entry.Transid === vData[i].Transid;
					});
				}
			}
			busyDialog.close();
			this.getView().getModel("JM_DASHBOARD").updateBindings(true);
			this.getView().getModel("JMVisiblity").getData().Drop = vValue;
			this.getView().getModel("JMVisiblity").updateBindings(true);
		},
		fnExpandTable: function(oEvent) {
			var vData = this.getView().getModel("JMVisiblity").getData().Expand;
			this.getView().getModel("JMVisiblity").getData().Expand = !vData;
			if (vData) {
				this.getView().getModel("JMVisiblity").getData().DBExpand = this._getImagePath("DBCollapse.svg");
			} else {
				this.getView().getModel("JMVisiblity").getData().DBExpand = this._getImagePath("DBExpand.svg");
			}
			this.getView().getModel("JMVisiblity").updateBindings(true);
		},
		// fnDropItem: function(oEvent) {
		// 	var vData = oEvent.getSource().getBindingContext("JM_DASHBOARD").getObject();
		// 	var oFullLevelData = this.getView().getModel("LevelModel").getProperty("/LevelData") || [];
		// 	var vValue = !vData.Drop;
		// 	vData._FilteredLevelData = oFullLevelData.filter(function(entry) {
		// 		return entry.Transid === vData.Transid;
		// 	});

		// 	if (vValue) {
		// 		oEvent.getSource().setSrc(this._getImagePath("arrowup.svg"));
		// 	} else {
		// 		oEvent.getSource().setSrc(this._getImagePath("DBDropDown.svg"));
		// 	}
		// 	oEvent.getSource().getBindingContext("JM_DASHBOARD").getObject().Drop = vValue;
		// 	// this.getView().getModel("JM_DASHBOARD").getData()[0].Drop = vValue;
		// 	this.getView().getModel("JM_DASHBOARD").updateBindings(true);
		// },
		fnDropItem: function(oEvent) {

			var oContext = oEvent.getSource().getBindingContext("JM_DASHBOARD");
			var oRowData = oContext.getObject();
			var sPath = oContext.getPath();

			var oDashModel = this.getView().getModel("JM_DASHBOARD");

			var aLevelData = this.getView()
				.getModel("LevelModel")
				.getProperty("/LevelData") || [];

			var bDrop = !oRowData.Drop;

			var aFiltered = aLevelData.filter(function(oItem) {
				return oItem.Transid === oRowData.Transid;
			});

			aFiltered.sort(function(a, b) {

				if (a.Roll === "Initiator" && b.Roll !== "Initiator") {
					return -1;
				}

				if (a.Roll !== "Initiator" && b.Roll === "Initiator") {
					return 1;
				}

				return 0;
			});

			oDashModel.setProperty(sPath + "/Drop", bDrop);
			oDashModel.setProperty(sPath + "/_FilteredLevelData", aFiltered);

			console.log("Transaction:", oRowData.Transid);
			console.log("Path:", sPath);
			console.log("Filtered Records:", aFiltered.length);
			console.log(aFiltered);

			if (bDrop) {
				oEvent.getSource().setSrc(this._getImagePath("arrowup.svg"));
			} else {
				oEvent.getSource().setSrc(this._getImagePath("DBDropDown.svg"));
			}

			oDashModel.refresh(true);
		},
		fnExportExcel: function() {
			sap.ui.core.BusyIndicator.show(0);
			var that = this;
			var oFullLevelData = that.getView().getModel("LevelModel").getProperty("/LevelData") || [];
			var filename = "DashBoard_Data.xlsx";
			var aExportData = [];

			var oList = this.getView().byId("id_List");
			var aItems = oList.getItems();

			var aData = [];
			var vSelectAll = this.getView().byId("DID_SELALL").getSelected();
			aItems.forEach(function(oItem) {
				if (!vSelectAll) {
					var oCtx = oItem.getBindingContext("JM_DASHBOARD");
					if (oCtx) {
						aData.push(oCtx.getObject());
					}
				} else {
					if (oItem.getContent()[0].getItems()[0].getItems()[0].getSelected()) {
						var oCtx = oItem.getBindingContext("JM_DASHBOARD");
						if (oCtx) {
							aData.push(oCtx.getObject());
						}
					}
				}
			});
			if (aData.length === 0) {
				var vError = 'W';
				// var vErrorMsg = this.getView().getModel("i18n").getResourceBundle().getText("NoData");
				// this.fnDisplaySnackBar(vError, vErrorMsg);
				ErrorHandler.showCustomSnackbar(this.getView().getModel("i18n").getResourceBundle().getText("NoData"), "Error", this);
				return;

				sap.ui.core.BusyIndicator.hide();
				return;
			}
			aData.forEach(function(oItem) {
				// Push main (header) row
				aExportData.push({
					"Status": oItem.Status,
					"Transaction ID": oItem.Transid,
					"Application Id": oItem.AppId,
					"SAP Code": oItem.Sapcode,
					"Description": oItem.Description,
					"Start Date": oItem.StartDate,
					"End Date": oItem.EndDate,
					"User Id": oItem.UserId,
					"Next Approver": oItem.NextApp,
					"Overall Time": oItem.OveralTime,
					"Role": "",
					"User ID": "",
					"Initiation Date": "",
					"Initiation Time": "",
					"Overall Time Taken": "",
					"Status(Level)": "",
					"SLA": "",
					"Reminder": ""
				});
				// Get matching subtable rows from LevelModel
				var aFiltered = oFullLevelData.filter(function(item) {
					return item.Transid === oItem.Transid;
				});

				// Push subtable rows
				aFiltered.forEach(function(sub) {
					aExportData.push({
						"Status": "",
						"Transaction ID": "", // blank for sub-rows
						"Application Id": "",
						"SAP Code": "",
						"Description": "",
						"Start Date": "",
						"End Date": "",
						"User Id": "",
						"Next Approver": "",
						"Overall Time": "",
						"Role": sub.Roll || "",
						"User ID": sub.UserId || "",
						"Initiation Date": sub.InitiatedDate || "",
						"Initiation Time": formatter.fnDBformatODataTime(sub.InitiatedTime) || "",
						"Overall Time Taken": sub.OveralAllTime || "",
						"Status(Level)": sub.Status || "",
						"SLA": "",
						"Reminder": ""
					});
				});
			});
			// return;
			var worksheet = window.XLSX.utils.json_to_sheet(aExportData, {
				skipHeader: false
			});
			var workbook = window.XLSX.utils.book_new();
			window.XLSX.utils.book_append_sheet(workbook, worksheet, "Material Headers");
			window.XLSX.writeFile(workbook, filename);

			setTimeout(function() {
				sap.ui.core.BusyIndicator.hide();
				//	ErrorHandler.showCustomSnackbar(i18n.getText("download_Success"), "success");
			}.bind(this), 1000);
		},
		// fnF4press: function(oEvent) {
		// 	var id = oEvent.getSource().getId().split("--")[1];
		// 	this.selectedField = id;
		// 	var f4type;
		// 	var process = "D";
		// 	if (["DID_STATUS", "ID_MDM_APPID"].includes(id)) {
		// 		f4type = "F";
		// 	} else {
		// 		f4type = "P";
		// 	}
		// 	if (id.substring(0, 3) === "KID") {
		// 		process = "K";
		// 	}
		// 	var oPayload = {
		// 		FieldId: id,
		// 		Process: process,
		// 		F4Type: f4type
		// 	};
		// 	oPayload.NavSerchResult = [];
		// 	this.bindTextF4model(oPayload, oEvent);
		// },
		fnF4press: function(oEvent) {
			var id = oEvent.getSource().getId().split("--")[1];
			this.selectedField = id;
			var f4type;
			var process = "D";
			if (["DID_STATUS"].includes(id)) {
				f4type = "F";
			} else {
				f4type = "P";
			}
			if (id.substring(0, 3) === "KID") {
				process = "K";
			}
			var oPayload = {
				FieldId: id,
				Process: process,
				F4Type: f4type
			};
			oPayload.NavSerchResult = [];

			// Added by srikanth
			var vMaster = this.getView().byId("UID_APPID").getSelectedKey();
			if (oPayload.FieldId === "ID_MDM_APPID") {
				oPayload.FieldNam1 = "MASTER";
				oPayload.Value1 = vMaster;
			}
			var vAppId = this.getView().byId("ID_MDM_APPID").getValue();
			if (oPayload.FieldId === "DID_TRANS_ID" && vAppId) {
				oPayload.FieldNam1 = "APP_ID";
				oPayload.Value1 = vAppId.split("-")[0];
			}
			this.bindTextF4model(oPayload, oEvent);
		},

		bindTextF4model: function(opayload, oEvent) {
			var oJsonModel;
			var vTitle;
			var oLabels = {};
			var vLength;
			var aFormattedRows = [];
			var omodel1 = this.getOwnerComponent().getModel("JM_Config");
			busyDialog.open();
			omodel1.create("/SearchHelpSet", opayload, {
				success: function(odata) {
					if (odata.MsgType === "E") {
						ErrorHandler.showCustomSnackbar(odata.Message, "Error", this);
						return;
					}

					var aResults = odata.NavSerchResult.results;
					if (aResults.length > 0) {
						var oFirst = aResults[0];
						if (oFirst && (oFirst.DomvalueL || oFirst.Ddtext)) {
							if (oFirst.MsgType === "I" || oFirst.MsgType === "E") {
								ErrorHandler.showCustomSnackbar(oFirst.Message, "Error", this);
								return;
							}
							vLength = aResults.length;
							oLabels.col1 = "Key";
							if (oFirst.Label2) oLabels.col2 = oFirst.Label2;
							aResults.forEach(function(item) {
								var row = {};
								if (item.DomvalueL !== "ALL") {
									if (oLabels.col1) row.col1 = item.DomvalueL;
									if (oLabels.col2) row.col2 = item.Ddtext;
									if (oLabels.col3) row.col3 = item.DomvalueL3;
									if (oLabels.col4) row.col4 = item.DomvalueL4;
									aFormattedRows.push(row);
								}
							});
							oJsonModel = new sap.ui.model.json.JSONModel({
								labels: oLabels,
								rows: aFormattedRows
							});
							this.getView().setModel(oJsonModel, "JM_F4Model");
							vTitle = this.getView().byId(this.selectedField + "_TXT").getText() + " (" + vLength + ")";
							this.fnF4fragopen(oEvent, vTitle).open();
						} else {
							vLength = odata.NavSerchResult.results.length;
							if (oFirst.MsgType === "I" || oFirst.MsgType === "E") {
								ErrorHandler.showCustomSnackbar(oFirst.Message, "Error", this);
								return;
							}
							if (oFirst.Label1) oLabels.col1 = oFirst.Label1;
							if (oFirst.Label2) oLabels.col2 = oFirst.Label2;
							if (oFirst.Label3) oLabels.col3 = oFirst.Label3;
							if (oFirst.Label4) oLabels.col4 = oFirst.Label4;

							if (this.selectedField === "ID_RECI_VAGRP") {
								aResults
									.filter(function(item) {
										return item.Value3 === this.getView().getModel("JM_KeydataModel").getProperty("/Werks");
									})
									.forEach(function(item) {
										var row = {};
										row.col1 = item.Value1;
										if (oLabels.col2) row.col2 = item.Value2;
										if (oLabels.col3) row.col3 = item.Value3;
										if (oLabels.col4) row.col4 = item.Value4;
										aFormattedRows.push(row);
									});
							} else {
								aResults.forEach(function(item) {
									var row = {};
									if (oLabels.col1 === "Material") {
										row.col1 = item.Value1 ? item.Value1.replace(/^0+/, "") : item.Value1;
									} else {
										row.col1 = item.Value1;
									}
									if (oLabels.col2) row.col2 = item.Value2;
									if (oLabels.col3) row.col3 = item.Value3;
									if (oLabels.col4) row.col4 = item.Value4;
									aFormattedRows.push(row);
								});
							}
							oJsonModel = new sap.ui.model.json.JSONModel({
								labels: oLabels,
								rows: aFormattedRows
							});
							this.getView().setModel(oJsonModel, "JM_F4Model");
							this.getView().getModel("JM_F4Model");
							vTitle = this.getView().getModel("JM_F4Model").getData().labels.col1 + " (" + vLength + ")";
							this.fnF4fragopen(oEvent, vTitle).open();
						}
					}
					busyDialog.close();
				}.bind(this),
				error: function(oResponse) {
					busyDialog.close();

					var vError = 'E';
					ErrorHandler.showCustomSnackbar(this.getView().getModel("i18n").getResourceBundle().getText("httprequestfailed"), "Error",
						this);
					// return;
					return;
				}
			});

		},
		fnF4fragopen: function(oEvent, vTitle) {
			if (!this.f4HelpFrag) {
				this.f4HelpFrag = sap.ui.xmlfragment(this.getView().getId(), "MDM_QIR.Fragments.SearchHelp", this);
				this.getView().addDependent(this.f4HelpFrag);
			}
			this.f4HelpFrag.setTitle(vTitle);
			// sap.ui.getCore().byId("id_fragTile").setText(vTitle);
			return this.f4HelpFrag;
		},
		fnCloseSearchHelp: function() {

			this.f4HelpFrag.close();
			this.f4HelpFrag.destroy();
			this.f4HelpFrag = null;

		},
		fnTransaction: function() {
			var vItem = this.getView().byId("id_List").getItems();
			var vJMDash = this.getView().getModel("JM_DASHBOARD").getData();
			var vCheck = false;
			var vCount = 0;
			var vIndex = 0;

			for (var i = 0; i < vItem.length; i++) {
				var vValue = vItem[i].getContent()[0].getItems()[0].getItems()[0].getSelected();
				if (vValue && vCount <= 2) {
					vCount = vCount + 1;
					vCheck = true;
					vIndex = i;
				}
				if (vCount >= 2) {
					break;
				}
			}
			if (vCheck === false || vCount >= 2) {
				var vError = 'E';
				// var vErrorMsg = this.getView().getModel("i18n").getResourceBundle().getText("Pleaseselectitem");
				// this.fnDisplaySnackBar(vError, vErrorMsg);
				ErrorHandler.showCustomSnackbar(this.getView().getModel("i18n").getResourceBundle().getText("Pleaseselectitem"), "Error", this);
				return;
			}

			var vHeaderItem = this.getView().byId("id_listItem").getContent()[0].getItems();
			//	this.getView().byId("id_listItem").getContent()[0].getItems()[2].getItems()[0].getText()
			var vItemDet = vItem[vIndex].getContent()[0].getItems();
			var vTransDet = [];
			for (var i = 0; i < vHeaderItem.length; i++) {
				var obj = {};;
				if (i >= 2 && i !== 3) {

					if (i === 2) {

						obj = {
							Group: vHeaderItem[i].getItems()[0].getText(),
							Value: vItemDet[i].getItems()[0].getItems()[1].getText()
						};

					} else {
						obj.Group = vHeaderItem[i].getItems()[0].getText();
						if (i == 10) {
							obj.Value = vJMDash[vIndex].WfTimerText;
						} else {
							obj.Value = vItemDet[i].getItems()[0].getText();
						}

					}
					vTransDet.push(obj);
				}
			}

			var oJSModel = new sap.ui.model.json.JSONModel(vTransDet);
			this.getView().setModel(oJSModel, "JMTrDet");

			if (!this.TransFrag) {
				this.TransFrag = sap.ui.xmlfragment(this.getView().getId(), "MDM_QIR.Fragments.TransactionDet", this);
				this.getView().addDependent(this.TransFrag);
			}
			this.TransFrag.open();
			this.byId("DID_TRASTABLE").getColumns()[1].getHeader().setText(vJMDash[vIndex].Transid);
		},
		fnCloseTrans: function() {
			this.TransFrag.close();
		},
		fnF4Itempress: function(oEvent) {
			var oItem = oEvent.getSource();
			var oContext = oItem.getBindingContext("JM_F4Model");
			if (!oContext) {
				return;
			}
			var that = this;
			var item = oContext.getProperty("col1"); // Value (e.g., 'IN')
			var item2 = oContext.getProperty("col2");

			this.getView().byId(this.selectedField).setValue(item);

			if (this.selectedField === "ID_MDM_APPID") {
				this.getView().byId(this.selectedField).setValue(item + '-' + item2);
				var oModel = this.getView().getModel("JM_Config");
				oModel.read("/WFParmSet", {
					filters: [new sap.ui.model.Filter("AppId", sap.ui.model.FilterOperator.EQ, item)],
					success: function(oData) {

						if (item) {
							that.getView().byId("id_advSearch").setEnabled(true);
							that.getView().byId("id_advImage").removeStyleClass("cl_db_advanceIcon");
						}

						var oResult = oData.results[0];
						var oJson = new sap.ui.model.json.JSONModel({
							List: oData.results
						});
						that.getView().setModel(oJson, "JScreenParm");

						var oHBox = that.getView().byId("id_AdvanceSearchFields");
						oHBox.destroyContent();
						that._dynamicInputIds = [];
						oHBox.removeAllContent();
						that.fnAddInputField("Object Value", "DID_OBJVAL", false);
						if (oResult) {
							for (var i = 1; i <= 4; i++) {
								var sNameKey = "WfParm" + i + "Name";
								var sIdKey = "WfParm" + i + "Id";
								var sFieldName = oResult[sNameKey];
								var sFieldId = oResult[sIdKey];

								if (sFieldName && sFieldId) {
									that.fnAddInputField(sFieldName, sFieldId, true);
								}
							}
							that.fnAddButton();
						}
					},
					error: function(oResponse) {
						var sMessage = ErrorHandler.parseODataError(oResponse);
						ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
					}
				});

			}

			this.fnCloseSearchHelp();
		},
		fnInputDynamicF4press: function(oEvent) {
			var id = oEvent.getSource().getId().split("--")[1];
			this.selectedField = id;
			this.bindTextF4Help("P", id, "D", oEvent);
		},
		bindTextF4Help: function(SearchHelp, sitem, process, oEvent) {
			var oPayload = {
				FieldId: sitem,
				Process: process,
				F4Type: SearchHelp
			};
			oPayload.NavSerchResult = [];
			this.bindTextF4model(oPayload, oEvent);
		},
		fnAddInputField: function(sLabelText, sInputIdSuffix, valueHelp) {
			var oHBox = this.getView().byId("id_AdvanceSearchFields");
			var sFieldId = sInputIdSuffix;
			var modifiedId = "D" + sFieldId.slice(1);
			// console.log(modifiedId);
			var oVBox = new sap.m.VBox({
				items: [
					new sap.m.Text({
						text: sLabelText
					}).addStyleClass("cl_label"),
					new sap.m.Input({
						id: this.createId(modifiedId),
						width: "100%",
						showValueHelp: valueHelp,
						valueHelpRequest: this.fnInputDynamicF4press.bind(this)
					}).addStyleClass("cl_input cl_inputmain")
				],
				layoutData: new sap.ui.layout.GridData({
					span: "L2 M6 S12"
				})
			});

			// Add to grid container

			// oVBox.addStyleClass("sapUiSmallMarginEnd");
			this._dynamicInputIds = this._dynamicInputIds || [];
			if (sFieldId !== "DID_OBJVAL") {
				this._dynamicInputIds.push(modifiedId);
			}
			oHBox.addContent(oVBox);
		},
		fnAddButton: function() {
			var oHBox = this.getView().byId("id_AdvanceSearchFields");
			var vContent = oHBox.getContent().length;
			var vGrid = 12 - vContent * 2;

			var vSpan = "L" + vGrid + " M6 S12";

			var oButtonBox = new sap.m.HBox({
				justifyContent: "End",
				width: "100%",
				items: [
					new sap.m.Button({
						icon: this._getImagePath("ClearDB.svg"),
						text: "{i18n>Clear}",
						press: this.fnClearAll.bind(this),
						width: "5.5rem"
					}).addStyleClass("cl_secondaryBtn cl_iconBtn cl_focusbtn"),

					new sap.m.Button({
						icon: this._getImagePath("SearchBtnDB.svg"),
						text: "{i18n>Search}",
						press: this.fnSearch.bind(this),
						width: "5.5rem"
					}).addStyleClass("cl_iconBtn cl_focusbtn cl_primaryBtn sapUiSmallMarginBegin")
				],
				layoutData: new sap.ui.layout.GridData({
					span: vSpan
				})
			});
			oButtonBox.addStyleClass("sapUiSmallMarginEnd sapUiSmallMarginTop");

			oHBox.addContent(oButtonBox);

		},
		fnAppIdLiveChange: function() {
			var vValue = this.getView().byId("ID_MDM_APPID").getValue();
			var that = this;
			if (vValue) {
				var oModel = this.getView().getModel("JM_Config");
				oModel.read("/WFParmSet", {
					filters: [new sap.ui.model.Filter("AppId", sap.ui.model.FilterOperator.EQ, vValue)],
					success: function(oData) {

						if (vValue) {
							that.getView().byId("id_advSearch").setEnabled(true);
							that.getView().byId("id_advImage").removeStyleClass("cl_db_advanceIcon");
						}

						var oResult = oData.results[0];
						var oJson = new sap.ui.model.json.JSONModel({
							List: oData.results
						});
						that.getView().setModel(oJson, "JScreenParm");

						var oHBox = that.getView().byId("id_AdvanceSearchFields");
						oHBox.destroyContent();
						that._dynamicInputIds = [];
						oHBox.removeAllContent();
						that.fnAddInputField("Object Value", "DID_OBJVAL", false);
						if (oResult) {
							for (var i = 1; i <= 4; i++) {
								var sNameKey = "WfParm" + i + "Name";
								var sIdKey = "WfParm" + i + "Id";
								var sFieldName = oResult[sNameKey];
								var sFieldId = oResult[sIdKey];

								if (sFieldName && sFieldId) {
									that.fnAddInputField(sFieldName, sFieldId, true);
								}
							}

						}
						that.fnAddButton();
					},
					error: function(oResponse) {
						var sMessage = ErrorHandler.parseODataError(oResponse);
						ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
					}
				});
			} else {
				that.getView().byId("id_advSearch").setEnabled(false);
				that.getView().byId("id_advImage").addStyleClass("cl_db_advanceIcon");
			}
		},
		fnClearAll: function() {
			var vID = ["DID_TRANS_ID", "DID_AGENT", "ID_MDM_APPID", "DID_STATUS", "DID_OBJVAL"];
			var vDashbord = this.getView().getModel("JM_DASHBOARD");
			var that = this;
			vID.forEach(function(id) {
				var vInput = that.getView().byId(id);
				if (vInput) {
					vInput.setValue("");
				}
			});
			if (this._dynamicInputIds) {
				this._dynamicInputIds.forEach(function(id) {
					var oInput = that.getView().byId(id);
					if (oInput) {
						oInput.setValue("");
					}
				});
			}

			that.getView().byId("id_advSearch").setEnabled(false);
			that.getView().byId("id_advImage").addStyleClass("cl_db_advanceIcon");

			if (vDashbord !== undefined) {
				vDashbord.setData([]);
			}
		},
		fnSearch: function() {
			this.fngetSearch(0, 0);
		},

		fnFilterSearchHelp: function(oEvent) {

			var sQuery = oEvent.getSource().getValue();
			// Get table and binding
			var oTable = this.byId("id_searchhelpTable");
			var oBinding = oTable.getBinding("items");
			if (!oBinding) {
				return;
			}
			var aFilters = [];
			// Filter on all possible columns
			if (sQuery) {
				aFilters.push(new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("col1", sap.ui.model.FilterOperator.Contains, sQuery),
						new sap.ui.model.Filter("col2", sap.ui.model.FilterOperator.Contains, sQuery),
						new sap.ui.model.Filter("col3", sap.ui.model.FilterOperator.Contains, sQuery),
						new sap.ui.model.Filter("col4", sap.ui.model.FilterOperator.Contains, sQuery)
					],
					and: false
				}));
			}
			oBinding.filter(aFilters, "Application");
		},
		fnPageNext: function() {
			this.CurrentPage = this.CurrentPage + 1;
			var skip = 250 * this.CurrentPage;
			skip = skip - 250;
			this.fngetSearch(250, skip);

		},
		fnPagePrevious: function() {
			this.CurrentPage = this.CurrentPage - 1;
			var skip = 250 * this.CurrentPage;
			skip = skip - 250;
			if (skip === 0) {
				this.fngetSearch(0, 0);
			} else {
				this.fngetSearch(250, skip);
			}
			if (this.CurrentPage === 1) {
				this.getView().byId("DID_PREVIOUS").setEnabled(false);
			}

		},

		fnAnalytics: function() {
			this.getOwnerComponent().getRouter().navTo("Analytics");
		},
		fnCompare: function() {
			this.getOwnerComponent().getRouter().navTo("Compare");
		},
		fnOpen: function(oEvent) {
			var vFinalBinding = [];
			var vSelectedIndex = [];

			var vColumnArray = this.getView().byId('id_listItem').getContent()[0].getItems();
			for (var i = 2; i < vColumnArray.length; i++) {
				var vText = this.getView().byId('id_listItem').getContent()[0].getItems()[i].getItems()[0];

				var vTextValue = vText.getText();
				var vVisible = this.getView().byId('id_listItem').getContent()[0].getItems()[i].getVisible();

				vFinalBinding.push({
					CName: vTextValue,
					CId: i,
					Visible: vVisible

				});
				if (vColumnArray[i].getVisible()) {
					vSelectedIndex.push(i);
				}
			}
			var oVisibleModel = new sap.ui.model.json.JSONModel(vFinalBinding);
			this.getView().setModel(oVisibleModel, "JMColumn");
			var oButton = oEvent.getSource();
			if (!this.popover) {
				this.popover = sap.ui.xmlfragment("MDM_QIR.Fragments.Columns", this);
				this.getView().addDependent(this.popover);
			}
			this.popover.openBy(oButton);
			this.fnSelectedItem();

		},
		fnApply: function() {

			var vSelectText = sap.ui.getCore().byId("id_wrapTextSele").getSelected();

			var vColumnModel = this.getView().getModel("JMColumn");
			var vColumnArray = [];
			if (vColumnModel !== undefined) {
				vColumnModel.updateBindings(true);
				vColumnArray = vColumnModel.getData();
			}
			var vAllFalse = vColumnArray.every(function(oItem) {
				return oItem.Visible === false;
			});
			if (vAllFalse === true) {
				var vError = 'W';
				// var vErrorMsg = this.getView().getModel("i18n").getResourceBundle().getText("ColumnSelectionMandatory");
				// this.fnDisplaySnackBar(vError, vErrorMsg);
				ErrorHandler.showCustomSnackbar(this.getView().getModel("i18n").getResourceBundle().getText("ColumnSelectionMandatory"), "Error",
					this);

				return;

			} else {
				var vCheck = true;
				var vCount = 0;
				var result = vColumnArray.reduce(function(obj, item) {
					obj[item.CId] = item.Visible;

					if (!item.Visible) {
						vCheck = false;
					} else {
						vCount = vCount + 1;
					}
					return obj;

				}, {});
				result.Wrap = vSelectText;
				this.fnCancel();

			}
			var oVisibleModel = new sap.ui.model.json.JSONModel(result);
			this.getView().setModel(oVisibleModel, "JMCloumnVisible");
			var vVisData = this.getView().getModel("JMVisiblity").getData();
			if (vCheck === false) {

				var vPercent = parseInt(90 / vCount) + "%";
				vVisData.Status = vPercent;
				vVisData.TransId = vPercent;
				vVisData.Application = vPercent;
				vVisData.Code = vPercent;
				vVisData.Description = vPercent;
				vVisData.SDate = vPercent;
				vVisData.EDate = vPercent;
				vVisData.User = vPercent;
				vVisData.TLeft = vPercent;
				vVisData.Overall = vPercent;
			} else {
				vVisData.Status = "10%";
				vVisData.TransId = "9%";
				vVisData.Application = "10%";
				vVisData.Code = "10%";
				vVisData.Description = "10%";
				vVisData.SDate = "7%";
				vVisData.EDate = "7%";
				vVisData.User = "7%";
				vVisData.TLeft = "10%";
				vVisData.Overall = "10%";
			}
			if (vSelectText === false) {
				this.getView().getModel("JMVisiblity").getData().Description = "14%";
			} else {
				this.getView().getModel("JMVisiblity").getData().Description = "10%";
			}
			this.getView().getModel("JMVisiblity").updateBindings(true);

		},
		fnColumnFilter: function(oEvent) {

			var sQuery = oEvent.getSource().getValue();
			// Get table and binding
			var oTable = sap.ui.getCore().byId("id_columnSel");
			var oBinding = oTable.getBinding("items");
			if (!oBinding) {
				return;
			}
			var aFilters = [];
			// Filter on all possible columns
			if (sQuery) {
				aFilters.push(new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("CName", sap.ui.model.FilterOperator.Contains, sQuery)

					],
					and: false
				}));
			}
			oBinding.filter(aFilters, "Application");
		},
		fnTableSel: function(oEvent) {
			var vDashData = this.getView().getModel("JM_DASHBOARD").getData();
			busyDialog.open();
			var vItem = this.getView().byId("id_List").getItems();
			for (var i = 0; i < vDashData.length; i++) {
				vDashData[i].Select = oEvent.getSource().getSelected();
				if (vDashData[i].Select) {
					vItem[i].getContent()[0].getItems()[0].getItems()[0].addStyleClass('cl_checkboxSel');
					vItem[i].getContent()[0].getItems()[0].getItems()[0].removeStyleClass('cl_checkbox');
				} else {
					vItem[i].getContent()[0].getItems()[0].getItems()[0].removeStyleClass('cl_checkboxSel');
					vItem[i].getContent()[0].getItems()[0].getItems()[0].addStyleClass('cl_checkbox');
				}

			}
			if (!oEvent.getSource().getSelected()) {
				oEvent.getSource().removeStyleClass('cl_checkboxSel');
				oEvent.getSource().addStyleClass('cl_checkbox');
			} else {

				oEvent.getSource().removeStyleClass('cl_checkbox');
				oEvent.getSource().addStyleClass('cl_checkboxSel');

			}
			busyDialog.close();
		},
		fnCheckSel: function(oEvent) {
			if (!oEvent.getSource().getSelected()) {
				oEvent.getSource().removeStyleClass('cl_checkboxSel');
				oEvent.getSource().addStyleClass('cl_checkbox');
			} else {

				oEvent.getSource().removeStyleClass('cl_checkbox');
				oEvent.getSource().addStyleClass('cl_checkboxSel');

			}
		},
		fnCheckSelAll: function(oEvent) {
			var vData = this.getView().getModel('JMColumn').getData();
			if (!oEvent.getSource().getSelected()) {
				oEvent.getSource().removeStyleClass('cl_checkboxSel');
				oEvent.getSource().addStyleClass('cl_checkbox');
			} else {

				oEvent.getSource().removeStyleClass('cl_checkbox');
				oEvent.getSource().addStyleClass('cl_checkboxSel');

			}
			vData.forEach(function(oItem) {

				oItem.Visible = oEvent.getSource().getSelected();
			});
			this.getView().getModel('JMColumn').updateBindings(true);
			this.fnSelectedItem();

		},
		fnSelectedItem: function() {

			var vData = this.getView().getModel('JMColumn').getData();
			var vItems = sap.ui.getCore().byId('id_columnSel').getItems();
			for (var i = 0; i < vData.length; i++) {
				if (!vData[i].Visible) {
					vItems[i].getContent()[0].getItems()[0].getItems()[0].removeStyleClass('cl_checkboxSel');
					vItems[i].getContent()[0].getItems()[0].getItems()[0].addStyleClass('cl_checkbox');
				} else {
					vItems[i].getContent()[0].getItems()[0].getItems()[0].removeStyleClass('cl_checkbox');
					vItems[i].getContent()[0].getItems()[0].getItems()[0].addStyleClass('cl_checkboxSel');
				}

			}
		},
		fnCancel: function() {

			var oSearch = sap.ui.getCore().byId("id_popover_search");

			if (oSearch) {
				oSearch.setValue("");
			}

			var oList = sap.ui.getCore().byId("id_columnSel");

			if (oList) {

				var oBinding = oList.getBinding("items");

				if (oBinding) {
					oBinding.filter([]);
				}
			}

			this.popover.close();
		},
		fnstartWfTimerDirectId: function() {
			var oList = this.byId("id_List");
			var oModel = oList.getModel("JM_DASHBOARD");

			if (this._wfTimerList) {
				clearInterval(this._wfTimerList);
			}

			this._wfTimerList = setInterval(function() {

				oModel.getData().forEach(function(oData, iIndex) {

					oModel.setProperty("/" + iIndex + "/WfTimerText", "");

					if (oData.Status === "Reject" || oData.Status === "Rejected" || oData.Status === "Complete" || oData.Status === "Completed") {
						return;
					}

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

					oModel.setProperty("/" + iIndex + "/WfTimerText", sFinal);
				});

			}, 1000);
		},

		onExit: function() {
			if (this._wfTimer) {
				clearInterval(this._wfTimer);
			}
		},
		fnDisplaySnackBar: function(MsgType, Message) {
			var vError = this.getView().getModel("i18n").getResourceBundle().getText("Error");
			var vSuccess = this.getView().getModel("i18n").getResourceBundle().getText("Success");
			var vWarning = this.getView().getModel("i18n").getResourceBundle().getText("Warning");
			var vInfo = this.getView().getModel("i18n").getResourceBundle().getText("Info");

			if (!this.snackbar) {
				this.snackbar = sap.ui.xmlfragment("MDM_QIR.Fragments.Snackbar", this);
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
				oEntity.ImgIcon = this._getImagePath("Error.svg");
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
				oEntity.ImgIcon = this._getImagePath("Success.svg");
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
				oEntity.ImgIcon = this._getImagePath("Warning.svg");
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
				oEntity.ImgIcon = this._getImagePath("Information.svg");
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
		},

		// 		/******************************** Transid selection Logic(Start)***********************************/
		fnNavTransid: function(oEvent) {
			var ContextData;
			var oParmModel;
			var index = oEvent.getSource().getBindingContext("JM_DASHBOARD").sPath.split("/")[1];
			var vTransid = oEvent.getSource().getModel("JM_DASHBOARD").getProperty("/" + index).Transid;
			var status = oEvent.getSource().getModel("JM_DASHBOARD").getProperty("/" + index).Status;
			var vViewstateModel = new sap.ui.model.json.JSONModel({
				fromSearch: false,
				fromKeyData: false,
				fromInitiator: false,
				fromDashboard: true,
				fromUWL: false
			});
			this.getOwnerComponent().setModel(vViewstateModel, "JM_ViewStateModel");

			var vcode = vTransid.replace(/\d+/g, "");
			var Progress = "";
			if (status === "Complete") {
				Progress = "Complete";
			} else if (status === "Requested / Inprogress") {
				Progress = "Inprogress";
			} else if (status === "Sendback") {
				Progress = "SendBack";
			} else if (status === "Reject") {
				Progress = "Reject";
			} else if (status === "Saved as draft") {
				Progress = "Draft";
			}
			var vProcessModel = this.getOwnerComponent().getModel("JM_processModel");
			if (!vProcessModel) {
				vProcessModel = new sap.ui.model.json.JSONModel({
					Role: "",
					Vendor: true,
					Customer: false
				});
				this.getOwnerComponent().setModel(vProcessModel, "JM_processModel");
			}
			// if (vcode === "QIRC") {
			// 	vProcessModel.setProperty("/Role", "Vendor");
			// 	vProcessModel.setProperty("/Vendor", true);
			// 	vProcessModel.setProperty("/Customer", false);
			// } else {
			// 	vProcessModel.setProperty("/Role", "Customer");
			// 	vProcessModel.setProperty("/Vendor", false);
			// 	vProcessModel.setProperty("/Customer", true);
			// }
			if (status === "Rejected") {

			} else if (status === "Saved as draft") {

				// if (vcode === "VC") {
				ContextData = {
					Ind: "X",
					Transid: vTransid,
					MsgType: "D",
					Appid: vcode,
					TypeLevel: "I",
					Progress: Progress
				};
				oParmModel = new sap.ui.model.json.JSONModel(ContextData);
				this.getOwnerComponent().setModel(oParmModel, "JM_ContextModel");
				if (vcode === "QIRMC") {
					sap.ui.core.UIComponent.getRouterFor(this).navTo("MassCreate");
				} else if (vcode === "QIRMX") {
					sap.ui.core.UIComponent.getRouterFor(this).navTo("MassChange");
				} else {
					sap.ui.core.UIComponent.getRouterFor(this).navTo("Initiator");
				}
				// } else {
				// 	ContextData = {
				// 		Ind: "X",
				// 		Transid: vTransid,
				// 		MsgType: "D",
				// 		Appid: "CC",
				// 		TypeLevel: "I",
				// 		Progress: Progress
				// 	};
				// 	oParmModel = new sap.ui.model.json.JSONModel(ContextData);
				// 	this.getOwnerComponent().setModel(oParmModel, "JM_ContextModel");
				// 	sap.ui.core.UIComponent.getRouterFor(this).navTo("Initiator");
				// }

			} else {
				ContextData = {
					Ind: "X",
					Transid: vTransid,
					MsgType: "T",
					Appid: vcode,
					TypeLevel: "I",
					Progress: Progress
				};
				oParmModel = new sap.ui.model.json.JSONModel(ContextData);
				this.getOwnerComponent().setModel(oParmModel, "JM_ContextModel");
				if (vcode === "QIRMC") {
					sap.ui.core.UIComponent.getRouterFor(this).navTo("MassCreate");
				} else if (vcode === "QIRMX") {
					sap.ui.core.UIComponent.getRouterFor(this).navTo("MassChange");
				} else {
					sap.ui.core.UIComponent.getRouterFor(this).navTo("Initiator");
				}
			}
			// var oGlobalModel = new sap.ui.model.json.JSONModel({
			// 	TransId: this.getView().byId("DID_TRANS_ID").getValue(),
			// 	UserId: this.getView().byId("DID_AGENT").getValue(),
			// 	AppID: this.getView().byId("ID_MDM_APPID").getValue(),
			// 	FromDate: this.getView().byId("DID_FDATE").getValue(),
			// 	ToDate: this.getView().byId("DID_TDATE").getValue(),
			// 	// DateRange: this.getView().byId("DID_DATERANGE").getValue(),
			// 	Status: this.getView().byId("DID_STATUS").getSelectedKey(),
			// 	ObjValue: this.getView().byId("DID_OBJVAL").getValue()
			// });
			// this.getOwnerComponent().setModel(oGlobalModel, "JM_Dashboard_GlobalModel");
		},

	});

});