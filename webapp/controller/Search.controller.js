sap.ui.define([
	"MDM_QIR/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"MDM_QIR/controller/ErrorHandler",
	"sap/ui/export/Spreadsheet",
	"MDM_QIR/Formatter/formatter"
], function(BaseController, JSONModel, ErrorHandler, Spreadsheet, formatter) {
	"use strict";
	var i18n;
	var userName;
	return BaseController.extend("MDM_QIR.controller.Search", {
		formatter: formatter,
		onInit: function() {
			BaseController.prototype.onInit.apply(this, arguments);
			this.f4Cache = {};

			this.getView().getModel("i18n");

			var oBundle = this.getOwnerComponent()
				.getModel("i18n")
				.getResourceBundle();
			i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			var oConfigModel = this.getOwnerComponent().getModel("JM_Config");
			var oJsonModel = this.getOwnerComponent().getModel("JM_UserModel");
			var that = this;
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
			// for hide the back button 
			this.getView().byId("id_backbtn").setVisible(false);
			this.getView().byId("id_headtxt").addStyleClass("sapUiLargeMarginBegin");
			var columnModel = new JSONModel({
				columns: [{
					key: "matnr",
					label: oBundle.getText("matno"),
					visible: true,
					width: "120px"
				}, {
					key: "cnt",
					label: oBundle.getText("cnt"),
					visible: true,
					width: "70px"
				}, {
					key: "cre",
					label: oBundle.getText("cre"),
					visible: true,
					width: "80px"
				}, {
					key: "vendor",
					label: oBundle.getText("vendor"),
					visible: true,
					width: "9px"
				}, {
					key: "plant",
					label: oBundle.getText("plant"),
					visible: true,
					width: "70px"
				}, {
					key: "rdate",
					label: oBundle.getText("rdate"),
					visible: true,
					width: "100px"
				}, {
					key: "qr",
					label: oBundle.getText("qr"),
					visible: true,
					width: "80px"
				}, {
					key: "qact",
					label: oBundle.getText("qact"),
					visible: true,
					width: "100px"
				}, {
					key: "qorder",
					label: oBundle.getText("qorder"),
					visible: true,
					width: "100px"
				}, {
					key: "qassur",
					label: oBundle.getText("qassur"),
					visible: true,
					width: "100px"
				}, {
					key: "insp",
					label: oBundle.getText("insp"),
					visible: true,
					width: "150px"
				}, {
					key: "qsys",
					label: oBundle.getText("qsys"),
					visible: true,
					width: "120px"
				}, {
					key: "objnum",
					label: oBundle.getText("objnum"),
					visible: true,
					width: "120px"
				}, {
					key: "ltime",
					label: oBundle.getText("ltime"),
					visible: true,
					width: "90px"
				}, {
					key: "revlv",
					label: oBundle.getText("revlv"),
					visible: true,
					width: "90px"
				}]
			});

			var expandModel = new JSONModel({
				expand: false
			});

			var variantModel = new JSONModel({
				variants: [],
				ComboBoxvariants: [],
				counter: 1
			});
			var oHeaderModel = new sap.ui.model.json.JSONModel({
				col1: "",
				col2: ""
			});
			// F4 Help Data Model
			var oF4Model = new sap.ui.model.json.JSONModel({
				data: []
			});
			var oViewModel = new sap.ui.model.json.JSONModel({
				wrapText: false
			});

			this.getView().setModel(oViewModel, "view");
			this.getView().setModel(oF4Model, "JM_F4Help");
			this.getView().setModel(oHeaderModel, "F4Header");
			this.getView().setModel(variantModel, "JM_Variant");

			this.getView().setModel(expandModel, "JM_expandModel");
			this.getView().setModel(columnModel, "JM_ColModel");
			// this.byId("idCustomizeTable").selectAll();

			this.fn_getallvariants();
		},
		// fn_SelectionChange: function(oEvent) {

		// 	var oList = oEvent.getSource();
		// 	var oSelectedItem = oEvent.getParameter("listItem");

		// 	oList.getItems().forEach(function(oItem) {
		// 		oItem.removeStyleClass("cl_glowMenuItem");
		// 	});

		// 	if (oSelectedItem) {
		// 		oSelectedItem.addStyleClass("cl_glowMenuItem");
		// 	}
		// },
		fn_openvariant: function() {

			sap.ui.core.BusyIndicator.show(0);

			if (!this._oVariantDialog) {
				this._oVariantDialog = sap.ui.xmlfragment(
					this.getView().getId(),
					"MDM_QIR.Fragments.Variant",
					this
				);
				this.getView().addDependent(this._oVariantDialog);
			}

			sap.ui.core.BusyIndicator.hide();

			var sVariant = this._selectedVariantName;

			if (!sVariant || sVariant === "Select Variant") {
				this._selectedVariantName = null;
				this._oVariantDialog.open();
				return;
			}

			this._openConfirmDialog(
				"Confirmation",
				"Are you sure want to modify the existing variant ?",
				function() {
					this.fn_modifyVariant();
				}.bind(this),
				function() {
					// this._selectedVariantName = null;
					this._oVariantDialog.close();
				}.bind(this)
			);
		},
		fn_closevariant: function() {
			var oModel = this.getView().getModel("JM_Variant");
			var aData = oModel.getProperty("/variants");

			aData = aData.filter(function(oItem) {
				return !oItem.isNew;
			});

			oModel.setProperty("/variants", aData);

			if (this._oVariantDialog) {

				var oTable = this.byId("idVariantTable");
				var oBinding = oTable.getBinding("rows");

				if (oBinding) {
					oBinding.filter([]); // reset filter
				}

				this._oVariantDialog.close();
				this._oVariantDialog.destroy();
				this._oVariantDialog = null;
			}

			if (this._oVariantDialog) {
				this._oVariantDialog.close();
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
		_adjustColumnWidth: function() {
			var oTable = this.byId("idMaterialTable");

			setTimeout(function() {

				var aVisibleCols = oTable.getColumns().filter(function(col) {
					return col.getVisible();
				});

				if (aVisibleCols.length === 0) return;

				var iTableWidth = oTable.$().width();

				if (!iTableWidth) return;

				var iColWidth = Math.floor(iTableWidth / aVisibleCols.length);

				aVisibleCols.forEach(function(col) {
					col.setWidth(iColWidth + "px");
				});

			}, 0);

		},

		// fn_ApplyColumns: function() {
		// 	var oTable = this.byId("idCustomizeTable");
		// 	var aSelectedIndices = oTable.getSelectedIndices();
		// 	var oModel = this.getView().getModel("JM_ColModel");
		// 	var aColumns = oModel.getProperty("/columns");

		// 	aColumns.forEach(function(oCol) {
		// 		oCol.visible = false;
		// 	});

		// 	aSelectedIndices.forEach(function(iIndex) {
		// 		aColumns[iIndex].visible = true;
		// 	});
		// 	if (aSelectedIndices.length === 0) {
		// 		ErrorHandler.showCustomSnackbar(i18n.getText("Column_Select_Error"), "Error");
		// 		return;
		// 	}
		// 	oModel.refresh(true);
		// 	this.fn_applyColumnWidthLogic();
		// 	this._oColDialog.close();
		// 	this._adjustColumnWidth();
		// },
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

			this.fn_applyColumnWidthLogic();
			this._adjustColumnWidth();
			this._oColDialog.destroy();
			this._oColDialog = null;
			this._oColDialog.close();
		},
		fn_CloseCustomize: function() {
			this._oColDialog.destroy();
			this._oColDialog = null;
			this._oColDialog.close();
		},
		fn_applyColumnWidthLogic: function() {

			var oMainTable = this.byId("idMaterialTable");

			if (!oMainTable) return;

			var oColModel = this.getView().getModel("JM_ColModel");
			var aModelCols = oColModel.getProperty("/columns") || [];

			setTimeout(function() {

				var aColumns = oMainTable.getColumns().filter(function(oCol) {
					return oCol.getVisible();
				});

				if (aColumns.length === 0) return;

				// <= 9 columns => dynamic %
				if (aColumns.length <= 9) {

					var sWidth = (100 / aColumns.length) + "%";

					aColumns.forEach(function(oCol) {
						oCol.setWidth(sWidth);
					});

				} else {

					// > 9 columns => take width from model
					aColumns.forEach(function(oCol, iIndex) {

						var oModelData = aModelCols[iIndex];

						if (oModelData && oModelData.width) {
							oCol.setWidth(oModelData.width);
						} else {
							oCol.setWidth("120px");
						}

					});
				}

			}, 100);
		},
		fn_GlobalSearch: function(oEvent) {
			sap.ui.core.BusyIndicator.show(0);
			var sValue = oEvent.getSource().getValue();
			var oTable = this.byId("idMaterialTable");
			var oBinding = oTable.getBinding("rows");

			if (!oBinding) {
				sap.ui.core.BusyIndicator.hide();
				return;
			}

			var aFilters = [];

			if (!sValue) {
				oBinding.filter([]);
				sap.ui.core.BusyIndicator.hide();
				return;
			}

			sValue = sValue.trim();

			if (sValue) {
				var oGlobalFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("Count", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("Ersteller", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("Leiferant", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("Werk", sap.ui.model.FilterOperator.Contains, sValue),
						// new sap.ui.model.Filter("RDate", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("QRelease", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("QActive", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("QOrder", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("QAssur", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("Insp", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("QmSys", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("Objnum", sap.ui.model.FilterOperator.Contains, sValue),
						// new sap.ui.model.Filter("Ltime", sap.ui.model.FilterOperator.Contains, sValue),
						new sap.ui.model.Filter("Revlv", sap.ui.model.FilterOperator.Contains, sValue)
					],
					and: false
				});

				aFilters.push(oGlobalFilter);
				sap.ui.core.BusyIndicator.hide();
			}
			sap.ui.core.BusyIndicator.hide();
			oBinding.filter(aFilters);
			sap.ui.core.BusyIndicator.hide();
		},
		_updateTableCount: function(value) {

			var oText = this.byId("id_countText");
			if (oText) {
				oText.setText("(" + value + ")");
			}

		},
		fn_OpenCustomizeColumns: function() {

			if (this._oPopover) {
				this._oPopover.close();
			}

			this.fn_CustomizeColumns();
		},
		fn_ClearTable: function() {

			var oTable = this.byId("idMaterialTable");

			oTable.clearSelection();

			var oColModel = this.getView().getModel("JM_ColModel");

			oColModel.getProperty("/columns").forEach(function(c) {
				c.visible = true;
			});

			oColModel.refresh(true);

			if (this._oPopover) {
				this._oPopover.close();
			}
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
		fn_expandtable: function() {
			var oModel = this.getView().getModel("JM_expandModel");

			var expand = oModel.getProperty("/expand");

			oModel.setProperty("/expand", !expand);
			if (!expand) {
				this.getView().byId("idMaterialTable").setVisibleRowCount(12);
				this.getView().byId("id_maintable").setHeight("450px");
				this.getView().byId("id_expandbtn").setIcon(this.getView().getModel("JM_ImageModel").getProperty("/path") + "rexpandIcon.svg");
			} else {
				this.getView().byId("idMaterialTable").setVisibleRowCount(7);
				this.getView().byId("id_maintable").setHeight("290px");
				this.getView().byId("id_expandbtn").setIcon(this.getView().getModel("JM_ImageModel").getProperty("/path") + "ExpandIcon.svg");
			}
		},
		fn_search: function() {
			var vMatnr = this.getView().byId('SID_QIR_MATNR').getValue();
			var vVendor = this.getView().byId('SID_QIR_LIFNR').getValue();
			var vPlant = this.getView().byId('SID_QIR_WERKS').getValue();
			var iIndex = this.byId("idAndOrGroup").getSelectedIndex();
			var vAndOr = (iIndex === 0) ? true : false;
			sap.ui.core.BusyIndicator.show(300);

			if (!vMatnr && !vVendor && !vPlant) {
				ErrorHandler.showCustomSnackbar(i18n.getText("search_field_error"), "Error", this);
				sap.ui.core.BusyIndicator.hide();
				return;
			}

			var oDataModel = this.getOwnerComponent().getModel();
			var aFilters = [];

			if (vMatnr) {
				aFilters.push(new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, vMatnr));
			}

			if (vPlant) {
				aFilters.push(new sap.ui.model.Filter("Werk", sap.ui.model.FilterOperator.EQ, vPlant));
			}

			if (vVendor) {
				aFilters.push(new sap.ui.model.Filter("Leiferant", sap.ui.model.FilterOperator.EQ, vVendor));
			}

			var oModel = new sap.ui.model.json.JSONModel({
				data: []
			});
			var oCombinedFilter = new sap.ui.model.Filter({
				filters: aFilters,
				and: vAndOr
			});
			var that = this;
			oDataModel.read("/SearchMainSet", {
				filters: [oCombinedFilter],
				and: vAndOr,
				success: function(oData) {
					oModel.setProperty("/data", oData.results);
					var data = oModel.getProperty("/data");
					if (data.length === 0) {
						ErrorHandler.showCustomSnackbar(i18n.getText("search_success_0data"), "Info", that);
						sap.ui.core.BusyIndicator.hide();
					} else {
						ErrorHandler.showCustomSnackbar(i18n.getText("search_success"), "success", that);
						sap.ui.core.BusyIndicator.hide();
						var aData = oModel.getProperty("/data") || [];
						that._updateTableCount(oData.results.length);
					}
				},
				error: function(err) {
					sap.ui.core.BusyIndicator.hide();
					ErrorHandler.showCustomSnackbar(i18n.getText("search_err"), "Error", that);
					return;
				}
			});

			this.getView().setModel(oModel, "JM_Model");

		},
		fn_getallvariants: function() {
			var oModel = this.getOwnerComponent().getModel("JM_Config");
			var oPayload = {
				MdmMaster: "QIR",
				VariantName: "",
				FieldId: "",
				CreatedBy: "",
				Value: "",
				CreatedOn: null,
				Flag: "V",
				NavSearch_Variant: []
			};
			var that = this;
			// setTimeout(function() {
			// 	var oSelect = that.byId("idVariantCombo");

			// 	if (that._selectedVariantName && oSelect) {
			// 		oSelect.setSelectedKey(that._selectedVariantName);
			// 	}
			// }, 0);
			oModel.create("/Search_VariantSet", oPayload, {
				success: function(oData) {
					var oJsonModel = new sap.ui.model.json.JSONModel();
					var aResults = oData.NavSearch_Variant.results;
					aResults.forEach(function(oItem) {
						oItem.isNew = false;
					});
					var aCombo = [{
						VariantName: "",
						text: "Select Variant",
						isDefault: true
					}].concat(aResults);
					oJsonModel.setData(aResults);
					that.getView().getModel("JM_Variant").setProperty("/variants", aResults);
					that.getView().getModel("JM_Variant").setProperty("/ComboBoxvariants", aCombo);
				},
				error: function(err) {

				}
			});
		},
		fn_variantSearch: function(oEvent) {

			var sValue = oEvent.getParameter("newValue");

			var oTable = this.byId("idVariantTable");
			var oBinding = oTable.getBinding("rows");

			var aFilters = [];

			if (sValue) {
				var oFilter = new sap.ui.model.Filter(
					"VariantName",
					sap.ui.model.FilterOperator.Contains,
					sValue
				);
				aFilters.push(oFilter);
			}
			oBinding.filter(aFilters);
		},
		fn_modifyVariant: function() {

			var sVariantName = this._selectedVariantName;

			if (!sVariantName) {
				ErrorHandler.showCustomSnackbar("No variant selected", "Error", this);
				return;
			}

			var oPayload = this.fn_buildVariantPayload(sVariantName);

			var oDataModel = this.getOwnerComponent().getModel("JM_Config");
			var that = this;

			oDataModel.create("/Search_VariantSet", oPayload, {
				success: function() {
					ErrorHandler.showCustomSnackbar(i18n.getText("Variant_Updated"), "success", that);
					that.fn_getallvariants();
				},
				error: function() {
					ErrorHandler.showCustomSnackbar(i18n.getText("variant_update_err"), "Error", that);
				}
			});
		},
		fn_newVariant: function() {

			var oModel = this.getView().getModel("JM_Variant");
			var aData = oModel.getProperty("/variants");

			var bAlreadyExists = aData.some(function(oItem) {
				return oItem.isNew === true;
			});

			if (bAlreadyExists) {
				return;
			}

			var oNewRow = {
				VariantName: "",
				CreatedBy: userName,
				isNew: true
			};

			// Add new row at top
			aData.unshift(oNewRow);
			oModel.refresh(true);

			var oTable = this.byId("idVariantTable");

			setTimeout(function() {

				// Get first visible row
				var oRow = oTable.getRows()[0];

				if (oRow) {
					var oCells = oRow.getCells();

					if (oCells && oCells.length > 0) {
						var oHBox = oCells[0];

						var oInput = oHBox.getItems().find(function(oItem) {
							return oItem.isA("sap.m.Input");
						});

						if (oInput) {
							oInput.focus();
						}
					}
				}

			}, 100);
		},
		fn_buildVariantPayload: function(sVariantName) {

			var vMatno = this.byId("SID_QIR_MATNR").getId().split("--").pop();
			var vRevlevel = this.byId("SID_QIR_REVLV").getId().split("--").pop();
			var vVendor = this.byId("SID_QIR_LIFNR").getId().split("--").pop();
			var vPlant = this.byId("SID_QIR_WERKS").getId().split("--").pop();

			var fieldIds = [vMatno, vRevlevel, vVendor, vPlant];

			var arr = [];

			if (!this.byId(vMatno).getValue() && !this.byId(vRevlevel).getValue() && !this.byId(vVendor).getValue() && !this.byId(vPlant).getValue()) {
				ErrorHandler.showCustomSnackbar(i18n.getText("variant_field_empty"), "Error", this);
				return;
			}

			fieldIds.forEach(function(id) {
				if (this.byId(id).getValue() !== "") {
					arr.push({
						MdmMaster: "QIR",
						VariantName: sVariantName,
						FieldId: id,
						Value: this.byId(id).getValue(),
						Filter: "",
						CreatedBy: ""
					});
				}
			}.bind(this));

			// AND / OR
			var oGroup = this.byId("idAndOrGroup");
			var oSelected = oGroup.getSelectedButton();

			if (oSelected) {
				arr.push({
					MdmMaster: "QIR",
					VariantName: sVariantName,
					FieldId: "idAndOrGroup",
					Value: oSelected.getText(),
					Filter: "",
					CreatedBy: ""
				});
			}

			return {
				MdmMaster: "QIR",
				VariantName: sVariantName,
				FieldId: "",
				CreatedBy: "",
				Value: "",
				CreatedOn: null,
				Flag: "S",
				NavSearch_Variant: arr
			};
		},
		// onConfirmSubmit: function() {

		// 	var sAction = this.getView().getModel("confirmModel").getProperty("/action");

		// 	if (sAction === "MODIFY_VARIANT") {
		// 		this.fn_modifyVariant();
		// 	} else if (sAction === "SAVE_VARIANT") {
		// 		this.fn_savevariant();
		// 	}

		// 	this.byId("confirmDialog").close();
		// },
		fn_savevariant: function() {
			var oModel = this.getView().getModel("JM_Variant");
			var aData = oModel.getProperty("/variants");

			var oNewRow = aData.find(function(oItem) {
				return oItem.isNew === true;
			});

			if (!oNewRow) {
				ErrorHandler.showCustomSnackbar("Create new variant first", "Error", this);
				return;
			}

			if (!oNewRow.VariantName) {
				ErrorHandler.showCustomSnackbar(i18n.getText("varname_empty"), "Error", this);
				return;
			}

			var vMatno = this.byId("SID_QIR_MATNR").getId().split("--").pop();
			var vRevlevel = this.byId("SID_QIR_REVLV").getId().split("--").pop();
			var vVendor = this.byId("SID_QIR_LIFNR").getId().split("--").pop();
			var vPlant = this.byId("SID_QIR_WERKS").getId().split("--").pop();

			if (!this.byId("SID_QIR_MATNR").getValue() && !this.byId("SID_QIR_REVLV").getValue() && !this.byId("SID_QIR_LIFNR").getValue() && !
				this.byId("SID_QIR_WERKS").getValue()) {
				ErrorHandler.showCustomSnackbar(i18n.getText("variant_field_empty"), "Error", this);
				return;
			}

			var fieldIds = [vMatno, vRevlevel, vVendor, vPlant];

			var arr = [];
			for (var i = 0; i < fieldIds.length; i++) {
				if (this.byId(fieldIds[i]).getValue() !== "") {
					arr.push({
						MdmMaster: "QIR",
						VariantName: oNewRow.VariantName,
						FieldId: fieldIds[i],
						Value: this.byId(fieldIds[i]).getValue(),
						Filter: "",
						CreatedBy: ""
					});
				}
			}
			var oGroup = this.byId("idAndOrGroup");
			var oSelected = oGroup.getSelectedButton();

			if (oSelected) {
				arr.push({
					MdmMaster: "QIR",
					VariantName: oNewRow.VariantName,
					FieldId: "idAndOrGroup",
					Value: oSelected.getText(),
					Filter: "",
					CreatedBy: ""
				});
			}
			var oDataModel = this.getOwnerComponent().getModel("JM_Config");
			var oPayload = {
				MdmMaster: "QIR",
				VariantName: oNewRow.VariantName,
				FieldId: "",
				CreatedBy: "",
				Value: "",
				CreatedOn: null,
				Flag: "S",
				NavSearch_Variant: arr
			};
			var that = this;
			oDataModel.create("/Search_VariantSet", oPayload, {
				success: function(oData) {
					ErrorHandler.showCustomSnackbar(i18n.getText("Variant_Created"), "success", that);
					that.fn_getallvariants();
					that._selectedVariantName = oPayload.VariantName;
					that.getView().byId("idVariantCombo").setSelectedKey(oPayload.VariantName);
				},
				error: function(err) {
					ErrorHandler.showCustomSnackbar(i18n.getText("variant_creation_err"), "Error", that);
				}
			});

			oNewRow.isNew = false;

			oModel.refresh(true);

			this._oVariantDialog.close();
		},
		fn_VariantSelect: function(oEvent) {
			this.fn_clearFields();

			var oSelect = oEvent.getSource();

			var oSelectedItem = oEvent.getParameter("selectedItem");

			if (!oSelectedItem) return;

			var sKey = oSelectedItem.getKey();
			var oData = oSelectedItem.getBindingContext("JM_Variant").getObject();

			if (!sKey || oData.isDefault) {

				this.fn_clearFields();
				this._selectedVariantName = null;
				oSelect.setSelectedKey("");
				return;
			}

			this._selectedVariantName = sKey;
			oSelect.setSelectedKey(sKey);
			var oDataModel = this.getOwnerComponent().getModel("JM_Config");

			var oPayload = {
				MdmMaster: "QIR",
				VariantName: sKey,
				FieldId: "",
				CreatedBy: "",
				Value: "",
				CreatedOn: null,
				Flag: "G",
				NavSearch_Variant: []
			};

			var that = this;

			oDataModel.create("/Search_VariantSet", oPayload, {
				success: function(oData) {

					var arr = oData.NavSearch_Variant.results;

					arr.forEach(function(item) {

						if (item.FieldId === "idAndOrGroup") {

							var oGroup = that.byId(item.FieldId);

							oGroup.getButtons().forEach(function(oBtn, idx) {
								if (oBtn.data("key") === item.Value) {
									oGroup.setSelectedIndex(idx);
								}
							});

						} else {
							that.byId(item.FieldId).setValue(item.Value);
						}
					});

					that.onAfterVariantLoad();
					ErrorHandler.showCustomSnackbar(i18n.getText("Variant_set_successfully"), "success", that);

					that.fn_search();
				},
				error: function() {
					ErrorHandler.showCustomSnackbar(i18n.getText("Variant_set_failed"), "Error", that);
				}
			});
		},

		onAfterVariantLoad: function() {

			var that = this;

			// setTimeout(function() {

			var aFields = ["SID_QIR_MATNR", "SID_QIR_LIFNR", "SID_QIR_WERKS", "SID_QIR_REVLV"];

			aFields.forEach(function(field) {

				var oInput = that.byId(field);
				var sValue = oInput.getValue();

				if (sValue) {
					setTimeout(function() {
						that.fnReadf4Cache(field, sValue);
					}, 200);
				}

			});

			// }, 300);

		},
		fn_deleteVariant: function() {
			var oTable = this.byId("idVariantTable");
			var iSelectedIndex = oTable.getSelectedIndex();
			if (iSelectedIndex === -1) {
				ErrorHandler.showCustomSnackbar(i18n.getText("select_variant"), "Warning", this);
				return;
			}
			var oModel = this.getView().getModel("JM_Variant");

			var aData = oModel.getProperty("/variants");
			var oDataModel = this.getOwnerComponent().getModel("JM_Config");
			var oPayload = {
				MdmMaster: "QIR",
				VariantName: aData[iSelectedIndex].VariantName,
				FieldId: "",
				CreatedBy: "",
				Value: "",
				CreatedOn: null,
				Flag: "D",
				NavSearch_Variant: []
			};
			var that = this;
			sap.ui.core.BusyIndicator.show(300);
			oDataModel.create("/Search_VariantSet", oPayload, {

				success: function(oData) {
					ErrorHandler.showCustomSnackbar(i18n.getText("Variant_delete_successfully"), "success", that);
					sap.ui.core.BusyIndicator.hide();
					that.fn_getallvariants();
				},
				error: function(err) {
					ErrorHandler.showCustomSnackbar(i18n.getText("Variant_delete_failed"), "error", that);
					sap.ui.core.BusyIndicator.hide();
					return;
				}
			});
			oModel.refresh(true);
			oTable.clearSelection();
			ErrorHandler.showCustomSnackbar(i18n.getText("variant_deleted"), "success", that);
		},
		fn_DownloadExcel: function() {

			var oDataModel = this.getView().getModel("JM_Model");
			var aData = oDataModel.getProperty("/data");

			if (!aData || aData.length === 0) {
				ErrorHandler.showCustomSnackbar(i18n.getText("no_data_to_export"), "Error", this);
				return;
			}

			var oColModel = this.getView().getModel("JM_ColModel");
			var aAllColumns = oColModel.getProperty("/columns");

			var oColumnMap = {
				matnr: "Matnr",
				cnt: "Count",
				cre: "Ersteller",
				vendor: "Leiferant",
				plant: "Werk",
				rdate: "RDate",
				qr: "QRelease",
				qact: "QActive",
				qorder: "QOrder",
				qassur: "QAssur",
				insp: "Insp",
				qsys: "QmSys",
				objnum: "Objnum",
				ltime: "Ltime",
				revlv: "Revlv"
			};

			var aColumns = [];

			aAllColumns.forEach(function(oCol) {
				if (oCol.visible) {

					var sProperty = oColumnMap[oCol.key];

					if (sProperty === "RDate") {
						aColumns.push({
							label: oCol.label,
							property: sProperty,
							type: "string",
							formatter: function(sValue) {
								if (!sValue || sValue === "00000000") return "";

								return sValue.substring(6, 8) + "-" +
									sValue.substring(4, 6) + "-" +
									sValue.substring(0, 4);
							}
						});
					} else {
						aColumns.push({
							label: oCol.label,
							property: sProperty
						});
					}
				}
			});

			if (aColumns.length === 0) {
				sap.m.MessageToast.show("Please select at least one column");
				return;
			}

			var oSettings = {
				workbook: {
					columns: aColumns
				},
				dataSource: aData,
				fileName: "Material_Report.xlsx"
			};

			var oSpreadsheet = new sap.ui.export.Spreadsheet(oSettings);

			oSpreadsheet.build().finally(function() {
				oSpreadsheet.destroy();
			});
		},
		fn_gotokeydata: function() {
			var oItemModel = this.getOwnerComponent().getModel("JM_ItemsModel");
			if (oItemModel) {
				oItemModel.setProperty("/data", null);
			}
			var vViewstateModel = new sap.ui.model.json.JSONModel({
				fromDashboard: false,
				fromUWL: false,
				fromKeyData: false,
				fromSearch: true
			});
			this.getOwnerComponent().setModel(vViewstateModel, "JM_ViewStateModel");
			this.getOwnerComponent().getRouter().navTo("KeyData");
		},
		fn_gotomasscreate: function() {
			var oItemModel = this.getOwnerComponent().getModel("JM_ItemsModel");
			if (oItemModel) {
				oItemModel.setProperty("/data", null);
			}
			var vViewstateModel = new sap.ui.model.json.JSONModel({
				fromDashboard: false,
				fromUWL: false,
				fromKeyData: false,
				fromSearch: true
			});
			this.getOwnerComponent().setModel(vViewstateModel, "JM_ViewStateModel");
			var jsonData = {};

			jsonData = {
				Appid: "QIRMC",
				Transid: "",
				Ind: "X",
				WiId: "",
				TypeLevel: "I",
				SendBack: ""
			};
			var vParmModel = new sap.ui.model.json.JSONModel(jsonData);
			this.getOwnerComponent().setModel(vParmModel, "JM_ContextModel");
			this.getOwnerComponent().getRouter().navTo("MassCreate");
		},
		fn_gotomasschange: function() {
			var oItemModel = this.getOwnerComponent().getModel("JM_ItemsModel");
			if (oItemModel) {
				oItemModel.setProperty("/data", null);
			}
			var vViewstateModel = new sap.ui.model.json.JSONModel({
				fromDashboard: false,
				fromUWL: false,
				fromKeyData: false,
				fromSearch: true
			});
			this.getOwnerComponent().setModel(vViewstateModel, "JM_ViewStateModel");
			var jsonData = {};

			jsonData = {
				Appid: "QIRMX",
				Transid: "",
				Ind: "X",
				WiId: "",
				TypeLevel: "I",
				SendBack: ""
			};
			var vParmModel = new sap.ui.model.json.JSONModel(jsonData);
			this.getOwnerComponent().setModel(vParmModel, "JM_ContextModel");
			this.getOwnerComponent().getRouter().navTo("MassChange");
		},
		onAfterRendering: function() {
			var oTable = this.byId("idMaterialTable");

			setTimeout(function() {

				oTable.getColumns().forEach(function(oColumn) {
					oTable.autoResizeColumn(oColumn.getIndex());
				});

				this.fn_applyColumnWidthLogic();

			}.bind(this), 200);
		},
		fn_changeqir: function() {
			var oTable = this.getView().byId("idMaterialTable");
			var oModel = new sap.ui.model.json.JSONModel({
				data: []
			});

			var iIndex = oTable.getSelectedIndex();

			if (iIndex >= 0) {

				var oContext = oTable.getContextByIndex(iIndex);
				var oSelectedData = oContext.getObject();

				console.log("Selected Row:", oSelectedData);

			} else {
				ErrorHandler.showCustomSnackbar(i18n.getText("select_one_lineitem"), "Error", this);
				return;
			}
			if (oSelectedData) {
				var vViewstateModel = new sap.ui.model.json.JSONModel({
					fromDashboard: false,
					fromUWL: false,
					fromKeyData: false,
					fromSearch: true
				});
				this.getOwnerComponent().setModel(vViewstateModel, "JM_ViewStateModel");
				var oPayload = {
					AppId: 'QIRX',
					Matnr: oSelectedData.Matnr,
					Vendor: oSelectedData.Leiferant,
					Werks: oSelectedData.Werk,
					Revlv: oSelectedData.Revlv,
					Ind: 'K',
					NavKeyValues: []
				};
				oModel.setProperty("/data", oPayload);
				this.getOwnerComponent().setModel(oModel, "JM_ItemsModel");
				this.getOwnerComponent().getRouter().navTo("KeyData");
			}
		},
		fn_copyqir: function() {
				var oTable = this.getView().byId("idMaterialTable");
				var oModel = new sap.ui.model.json.JSONModel({
					data: []
				});

				var iIndex = oTable.getSelectedIndex();

				if (iIndex >= 0) {

					var oContext = oTable.getContextByIndex(iIndex);
					var oSelectedData = oContext.getObject();

					console.log("Selected Row:", oSelectedData);

				} else {
					ErrorHandler.showCustomSnackbar(i18n.getText("select_one_lineitem"), "Error", this);
					return;
				}
				if (oSelectedData) {
					var vViewstateModel = new sap.ui.model.json.JSONModel({
						fromDashboard: false,
						fromUWL: false,
						fromKeyData: false,
						fromSearch: true
					});
					this.getOwnerComponent().setModel(vViewstateModel, "JM_ViewStateModel");
					var oPayload = {
						AppId: 'QIRC',
						Matnr: oSelectedData.Matnr,
						Vendor: oSelectedData.Leiferant,
						Werks: oSelectedData.Werk,
						Revlv: oSelectedData.Revlv,
						Ind: 'K',
						MsgType: 'C',
						NavKeyValues: []
					};
					oModel.setProperty("/data", oPayload);
					this.getOwnerComponent().setModel(oModel, "JM_ItemsModel");
					this.getOwnerComponent().getRouter().navTo("KeyData");
				}
			}
			// fn_liveDataFetch: function(oEvent) {

		// 	var oInput = oEvent.getSource();
		// 	var sValue = oEvent.getParameter("value").toUpperCase();
		// 	var sInputId = oInput.getId().split("--").pop();

		// 	oInput.setValue(sValue);

		// 	if (!sValue) {
		// 		this.byId(sInputId + "DES").setValue("");
		// 		return;
		// 	}

		// 	this.fnReadf4Cache(sInputId, sValue);

		// },
		// fnReadf4Cache: function(vId, vValue) {

		// 	var that = this;

		// 	var updateDesc = function(results) {

		// 		var match = results.find(function(item) {
		// 			return item.Value1.replace(/^0+/, "") === vValue.replace(/^0+/, "");
		// 		});

		// 		if (match) {
		// 			that.byId(vId + "DES").setValue(match.Value2);
		// 		} else {
		// 			that.byId(vId + "DES").setValue("");
		// 		}

		// 	};

		// 	if (this.f4Cache[vId]) {

		// 		updateDesc(this.f4Cache[vId]);

		// 	} else {

		// 		this.f4descriptionGet(vId, function(results) {

		// 			that.f4Cache[vId] = results;
		// 			updateDesc(results);

		// 		});

		// 	}

		// },
		// f4descriptionGet: function(vId, fnCallback) {

		// 	var oModel = this.getOwnerComponent().getModel("JM_Config");

		// 	var oPayload = {
		// 		"FieldId": vId,
		// 		"F4Type": "P",
		// 		"Process": "S",
		// 		"NavSerchResult": []
		// 	};
		// 	oModel.create("/SearchHelpSet", oPayload, {

		// 		success: function(oData) {

		// 			if (fnCallback) {
		// 				fnCallback(oData.NavSerchResult.results);
		// 			}

		// 		},
		// 		error: function(oResponse) {

		// 			var sMessage = ErrorHandler.parseODataError(oResponse);
		// 			ErrorHandler.showCustomSnackbar(sMessage, "Error");
		// 		}

		// 	});

		// }
	});

});