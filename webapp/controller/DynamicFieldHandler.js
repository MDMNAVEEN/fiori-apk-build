sap.ui.define([
	"MDM_QIR/controller/BaseController",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Filter",
	"MDM_QIR/controller/ErrorHandler",
	"sap/m/VBox",
	"sap/m/Panel",
	"sap/ui/layout/Grid",
	"sap/ui/table/Table",
	"sap/ui/table/Column"
], function(BaseController, Filterperator, Filter, ErrorHandler, VBox, Panel, Grid, Table, Column) {
	"use strict";
	var i18n;
	return {
		onInit: function() {
			BaseController.prototype.onInit.apply(this, arguments);
			var panelModel = new sap.ui.model.json.JSONModel({
				step1: true,
				step2: true,
				step3: true,
				step4: true
			});
			this.getView().setModel(panelModel, "JM_panelModel");
			var oBundle = this.getOwnerComponent()
				.getModel("i18n")
				.getResourceBundle();
			i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			var oHeaderModel = new sap.ui.model.json.JSONModel({
				col1: "",
				col2: ""
			});

		},
		_createMainVBox: function() {
			return new sap.m.VBox({
				items: []
			}).addStyleClass("cl_search sapUiSmallMarginBottom");
		},
		_createVBoxInput: function() {
			return new sap.m.VBox({
				items: []
			}).addStyleClass("sapUiMediumMarginBegin sapUiLargeMarginEnd");
		},
		_createInputHBox: function() {
			return new sap.m.HBox({
				items: []
			}).addStyleClass("cl_gap sapUiTinyMarginTop");
		},
		_createVBoxSubView: function() {
			return new sap.m.VBox({
				items: []
			}).addStyleClass("");
		},
		_createPanel: function(oController, headtxt, sPanelKey, visible) {

			var oToolbar = this._createHeaderToolbar(oController, headtxt, sPanelKey, visible);

			return new sap.m.Panel({
				expandable: true,
				expanded: "{JM_panelModel>/" + sPanelKey + "}",
				expandAnimation: true,
				// width: "100%",
				headerToolbar: oToolbar
			}).addStyleClass("cl_matpanel");
		},
		_createHeaderToolbar: function(oController, headtxt, sPanelKey, visible) {

			return new sap.m.OverflowToolbar({
				content: [

					new sap.m.Title({
						text: headtxt
					}).addStyleClass("cl_headtxt2 sapUiSmallMarginBegin"),

					new sap.m.ToolbarSpacer(),

					new sap.m.HBox({
						AlignItems: "Center",
						items: [

							new sap.m.Button({
								AlignItems: "Center",
								icon: {
									path: "JM_panelModel>/" + sPanelKey,
									formatter: function(bState) {
										return bState ? oController.getView().getModel("JM_ImageModel").getProperty("/path") + "ArrowDownIcon.svg" :
											oController.getView().getModel("JM_ImageModel").getProperty("/path") + "ArrowUpIconPanel.svg";
									}
								},
								press: function() {
									oController.fn_togglePanel(sPanelKey);
								}
							}).addStyleClass("cl_roundIconBtn sapUiSmallMarginEnd sapUiSizeCompact")
						]
					}).addStyleClass("cl_gap")

				]
			}).addStyleClass("cl_svariant_toolbar ");

		},

		_createGrid: function() {
			return new sap.ui.layout.Grid({
				defaultSpan: "L3 M4 S12",
				vSpacing: 0,
				content: []
			}).addStyleClass("cl_vboxinputgrid");
		},
		_createGridForFiveInput: function() {
			return new sap.ui.layout.Grid({
				defaultSpan: "L2 M4 S12",
				vSpacing: 0,
				content: []
			}).addStyleClass("cl_vboxinputgrid");
		},
		_createGridFull: function() {
			return new sap.ui.layout.Grid({
				defaultSpan: "L12 M12 S12",
				vSpacing: 0,
				content: []
			});
		},
		_createHeaderText: function(oController, headtxt, visible) {

			var oHBox = new sap.m.HBox({
				width: "100%",
				alignItems: "Center",
				justifyContent: "SpaceBetween",
				items: [

					new sap.m.HBox({
						alignItems: "Center",
						items: [
							new sap.m.VBox({
								height: "1.4rem",
								items: []
							}).addStyleClass("cl_separatorline sapUiTinyMarginBegin"),

							new sap.m.Text({
								text: headtxt
							}).addStyleClass("cl_subheadtxt")
						]
					}),

					new sap.m.HBox({
						alignItems: "Center",
						items: [
							new sap.m.Button({
								icon: oController.getView().getModel("JM_ImageModel").getProperty("/path") + "PlusIcon.svg",
								visible: visible,
								tooltip: "{i18n>New_btn}",
								press: oController.fn_addrow.bind(oController)
							}).addStyleClass("cl_nvariant cl_nvariantin cl_smallicon sapUiSizeCompact"),

							new sap.m.Button({
								icon: oController.getView().getModel("JM_ImageModel").getProperty("/path") + "DeleteIcon.svg",
								tooltip: "{i18n>Delete_btn}",
								visible: visible,
								press: oController.fn_delrow.bind(oController)
							}).addStyleClass("cl_nvariant cl_nvariantin cl_smallicon sapUiSizeCompact sapUiTinyMarginBegin")
						]
					})
				]
			});

			if (headtxt !== "Linked Document") {
				oHBox.addStyleClass("sapUiTinyMarginTopBottom");
			}

			return oHBox;
		},
		_createMatnrField: function(oController, rqr, Fid, FDes, hide, wid, sFieldType, f4help, display, length, ruleValue) {
			var oControl;
			var sType = (sFieldType || "").toUpperCase().trim();
			var sFullId = oController.createId(Fid);
			var vDisplay = display === "X" ? false : true;

			if (sType === "DATS") {
				oControl = new sap.m.DatePicker({
					id: sFullId,
					visible: hide,
					width: "100%",
					displayFormat: "dd-MM-yyyy",
					valueFormat: "yyyyMMdd",
					// liveChange: oController.fn_liveDateChange ? oController.fn_liveDateChange.bind(oController) : null,
					editable: vDisplay,
					change: oController.fn_clearSingleFieldError ? oController.fn_clearSingleFieldError.bind(oController) : null
				}).addStyleClass("cl_input sapUiSizeCompact");
			} else {
				var sInputType = sap.m.InputType.Text;

				if (sType === "NUMC" || sType === 'INT1' || sType === 'QUAN') {
					sInputType = sap.m.InputType.Number;
				}

				f4help = !!f4help;

				oControl = new sap.m.Input({
					id: sFullId,
					visible: hide,
					width: "100%",
					type: sInputType,
					showValueHelp: f4help,
					editable: vDisplay,
					value: ruleValue,
					maxLength: parseInt(length, 10) || 0,
					valueHelpRequest: oController.fn_openF4 ? oController.fn_openF4.bind(oController) : null,
					liveChange: oController.fn_liveDataFetch ? oController.fn_liveDataFetch.bind(oController) : null,
					change: oController.fn_clearSingleFieldError ? oController.fn_clearSingleFieldError.bind(oController) : null
				}).addStyleClass("cl_input sapUiSizeCompact");
			}

			oControl.data("fieldId", Fid);
			oControl.data("fieldName", FDes);

			return new sap.m.VBox({
				width: wid,
				items: [
					oControl
				]
			});
		},
		_createMatdesField: function(wid, Fid, ruleDesc) {

			return new sap.m.VBox({
				width: wid,
				items: [

					new sap.m.VBox({
						width: "100%",
						items: [
							new sap.m.Input({
								id: Fid,
								value: ruleDesc,
								editable: false
									// value: "{JM_KeyDataModel>/Maktx}"
							}).addStyleClass("cl_input sapUiSizeCompact")
						]
					})
				]
			});
		},
		_createCheckBoxOnly: function(oController, bVisible, display) {

			var vDisplay = display === "X" ? false : true;

			return new sap.m.CheckBox({
				visible: bVisible,
				enabled: vDisplay,
				change: oController.fn_clearSingleFieldError ? oController.fn_clearSingleFieldError.bind(oController) : null

			}).addStyleClass("cl_checkbox sapUiSizeCompact");
		},
		_createCheckBoxInline: function(oController, Fid, sText, bVisible, display) {

			var vDisplay = display === "X" ? false : true;

			return new sap.m.VBox({
				width: "100%",
				items: [
					new sap.m.Label({
						text: sText
					}).addStyleClass("cl_label"),
					new sap.m.VBox({
						width: "100%",
						items: [
							new sap.m.CheckBox({
								id: oController.createId(Fid),
								visible: bVisible,
								enabled: vDisplay,
								select: function(oEvent) {
									if (oController.fnFieldChange) {
										oController.fnFieldChange(oEvent);
									}
									if (oController.fn_clearSingleFieldError) {
										oController.fn_clearSingleFieldError(oEvent);
									}

								}
							}).addStyleClass("cl_checkbox sapUiSizeCompact")
						]
					})
				]
			});
		},
		_createTable: function(oController, sModelName) {
			var oTable = new sap.ui.table.Table({
				width: "100%",
				visibleRowCount: 5,
				noData: new sap.m.VBox({
					alignItems: "Center",
					justifyContent: "Center",
					height: "100%",
					items: [
						new sap.m.Image({
							src: oController.getView().getModel("JM_ImageModel").getProperty("/path") + "NoDataFound.png",
							width: "120px",
							height: "120px"
						}),
						new sap.m.Text({
							text: "No Data Found"
						}).addStyleClass("cl_label")
					]
				})
			}).addStyleClass("cl_table sapUiTinyMarginTopBottom");

			oTable.bindRows(sModelName + ">/rows");
			return oTable;
		},
		_createColumn: function(oController, oField, sModelName) {
			var oTemplate;
			var sType = (oField.FieldFormat || "").toUpperCase();
			var display = oField.Dsply === "X" ? false : true;
			var maximumLength = Number(oField.FieldLength);

			if (sType === "DATS") {
				oTemplate = new sap.m.DatePicker({
					value: "{" + sModelName + ">" + oField.Fnm + "}",
					valueFormat: "yyyyMMdd",
					displayFormat: "dd-MM-yyyy",
					width: "100%",
					change: oController.fn_clearSingleFieldError ? oController.fn_clearSingleFieldError.bind(oController) : null
				}).addStyleClass("cl_tabinput cl_inputrev cl_input sapUiSizeCompact");
			} else {
				oTemplate = new sap.m.Input({
					value: "{" + sModelName + ">" + oField.Fnm + "}",
					type: sType === "NUMS" ? sap.m.InputType.Number : sap.m.InputType.Text,
					showValueHelp: !!oField.SearchHelp,
					width: "100%",
					editable: display,
					maxLength: maximumLength,
					valueHelpOnly: true,
					valueHelpRequest: oController.fn_openF4 ? oController.fn_openF4.bind(oController) : null,
					liveChange: oController.fn_clearSingleFieldError ? oController.fn_clearSingleFieldError.bind(oController) : null,
					change: oController.fn_clearSingleFieldError ? oController.fn_clearSingleFieldError.bind(oController) : null
				}).addStyleClass("cl_tabinput cl_input cl_inputrev sapUiSizeCompact");
			}

			oTemplate.data("fieldId", oField.FnmId);
			oTemplate.data("fieldName", oField.Fnm);
			oTemplate.data("tableModel", sModelName);

			return new sap.ui.table.Column({
				label: new sap.m.Label({
					text: oField.FmmDes
				}),
				tooltip: oField.FmmDes,
				template: oTemplate
			});
		},
		_createComboField: function(oController, rqr, Fid, FDes, hide, wid, modelName, path, keyField, textField) {

			var oCombo = new sap.m.ComboBox({
				id: oController.createId(Fid),
				width: "100%",
				visible: hide,
				required: rqr,

				selectionChange: function(oEvent) {
					if (oController.fn_VariantSelect) {
						oController.fn_VariantSelect(oEvent);
					}
				},

				items: {
					path: modelName + ">" + path,
					template: new sap.ui.core.Item({
						key: "{" + modelName + ">" + keyField + "}",
						text: "{" + modelName + ">" + textField + "}"
					})
				}
			}).addStyleClass("cl_varsel sapUiSizeCompact");

			return new sap.m.VBox({
				width: wid,
				items: [
					new sap.m.Label({
						text: FDes,
						required: rqr,
						visible: hide
					}).addStyleClass("cl_label"),
					oCombo
				]
			});
		}
	};
});