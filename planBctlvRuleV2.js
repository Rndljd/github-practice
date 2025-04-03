let bctlvAjaxData = {};
let bctlvDatatable;
const bctlvUrlParams = new URLSearchParams(window.location.search);

$(document).ready(function () {
    let basicPath = "/cbb-ui";
    const id = bctlvUrlParams.get("id");
    const series = bctlvUrlParams.get("series");
    const org = bctlvUrlParams.get("org");
    const state = bctlvUrlParams.get("state");
    const segment = bctlvUrlParams.get("segment");
    const product = bctlvUrlParams.get("product");
    const standard = bctlvUrlParams.get("standard");

    const bctlvDataRequestParams = {
        id: id,
        series: series,
        org: org,
        state: state,
        segment: segment,
        product: product,
        standard: standard
    };
    $('#validateBtn, #bctlvBtnContainer, #bctlvContainer').css('visibility', 'hidden');
    $.when(
        $.get('/cbb-ui/rule-management/fetchBCTLVRuleV2', {id: id}),
        $.ajax({
            url: '/cbb-ui/bctlvDropdown',
            method: "GET",
            data: bctlvDataRequestParams,
            contentType: 'application/json'
        }),
        $.get('/cbb-ui/rule-management/fetchCostShareOverrides')
    ).done(function (a1Response, a2Response, a3Response) {
        bctlvAjaxData.bctlvData = a1Response[0];
        bctlvAjaxData.benefitCategoryList = JSON.parse(a2Response[0]);
        bctlvAjaxData.costShareOverrides = a3Response[0];
        buildBctlvTable(bctlvAjaxData);
        $('div#bctlvSpinner').hide();
        $('#validateBtn, #bctlvBtnContainer, #bctlvContainer').css('visibility', 'visible');

        bctlvAjaxData.bctlvData.forEach((row) => {
            if (!row.benefitCategory) {
                $("#displayPopup").modal('show');
                return false;
            }
        });
    });

    loadQueryBuilders();
    $('[data-toggle="tooltip"]').tooltip();
    window.addEventListener("beforeunload", function (e) {
        var unsavedChanges = $('#unsavedChanges').val();
        if (unsavedChanges == 'true') {
            (e || window.event).returnValue = "";
            return "";
        } else {
            return null;
        }

        var checkOutById = $('#checkOutById').val();
        if (checkOutById) {
            (e || window.event).returnValue = "";
            return "";
        } else {
            return null;
        }

        const navigationEntries = performance.getEntriesByType('navigation');
        const isAgreeButtonClicked = sessionStorage.getItem('isAgreeButtonClicked') ? sessionStorage.getItem('isAgreeButtonClicked') : 'false';
        if (navigationEntries.length > 0 && (navigationEntries[0].type === 'reload' || navigationEntries[0].type === 'navigate') && isAgreeButtonClicked === 'false') {
            const productBaseID = $("#productBaseId").val();
            $.ajax({
                url: basicPath + "/benefitCodeError",
                type: 'DELETE',
                data: {
                    productBaseID: productBaseID
                },
                success: function(response) {
                    console.log('Success:', response);
                },
                error: function(error) {
                    console.error('Error:', error);
                }
            });
        }
    });

    $("#childRules").sortable();
    $('#serviceCompSetDiv').hide();
    $("#validate-benefit-codes").prop('disabled', true);
    $("#validate-Tier").prop('disabled', true);
    $('#serviceCompSetDiv').css('display', 'none');
    $('.open-modal').on('click', function () {
        const columnName = $(this).data('value');
        $('#columnName').text(columnName);
    });
    window.onpopstate = function () {
        sessionStorage.clear();
    };

    // buildOldBctlvTable();

    // var benCodeValidationToggle = "${pageContext.session.getAttribute('benefitCodesToggle')}";
    // if (benCodeValidationToggle) {
    // 	setTimeout(function() {
    // 		const el = $('#validateBtn').detach();
    // 		$('#pocBctlvTable_wrapper > .row:first-child > div[class^="col-"]:first-child').append(el);
    // 	}, 1000);
    // }

    $('#deleteAllChildRulesModal').on('shown.bs.modal', function (e) {
        $('button[name="delete-all-childrules-btn"]').unbind("click");
        $('button[name="delete-all-childrules-btn"]').attr('id', 'delete-allChildRules');
        $('#deleteAllChildRulesModal #delete-allChildRules').click(
            function () {
                $(".reorderTbody").empty();
                $("#delete-allChildRules-main").addClass('disabled');
                $('#deleteAllChildRulesModal').modal('hide');
            }
        );
    });

    $('#childRuleModal').on('shown.bs.modal', function (e) {
        prepareChildRuleAddModal(e);
    });

    $('#childRuleModal').on('hidden.bs.modal', function (e) {
        prepareChildRuleAddModal(e);
    });

    $("#planType").change(function () {
        var selected = $('#planType option:selected').val();
        populatePlansDropdown(selected);
    });

    $("#vbcPlanType").change(function () {
        const selected = $('#vbcPlanType option:selected').val();
        populatePlansDropdown(selected);
    });

    $("#selectAllCheckBoxes").click(function () {
        $(this).toggleClass('selected');
        $('input:checkbox.selectRow').prop('checked', $(this).hasClass('selected'));
    });

    $("#mainBctlvTable, #pocBctlvTable tr").each(function () {
        var $row = $(this);
        var $checkbox = $row.find('.bctlvV2Checkbox');
        var initialFont = $row.css("font-weight")
        $checkbox.on("change", function () {
            if ($(this).is(":checked")) {
                $row.css("font-weight", "bold");
                $row.find('td.bctlvV2Row').css("font-weight", "bold");
                $row.find('.selectOption').css("font-weight", "bold");
            } else {
                $row.css("font-weight", initialFont);
                $row.find('td.bctlvV2Row').css("font-weight", initialFont);
                $row.find('.selectOption').css("font-weight", initialFont)
            }
        });
    });

    $('#selectAllCheckbox').on('click', function () {
        const rows = $('#pocBctlvTable tr');
        const dropdowns = $('#pocBctlvTable tr select');

        const $checkboxes = $('.bctlvV2Checkbox');
        if ($(this).is(':checked')) {
            $checkboxes.prop('checked', true);
            $checkboxes.trigger('change');

            rows.addClass('row-selected');
            dropdowns.addClass('row-selected');

            let rowData = {};
            const productBaseId = bctlvUrlParams.get('id');
            selectedRows = [];
            bctlvAjaxData.bctlvData.forEach(data => {
                rowData = {
                    ruleId: data.planBCTLVRuleV2ID,
                    status: data.status,
                }

                selectedRows.push(rowData);
            });
        } else {
            selectedRows = [];
            $checkboxes.prop('checked', false);
            $checkboxes.trigger('change');

            rows.removeClass('row-selected');
            dropdowns.removeClass('row-selected');
        }

        console.log("selectedRows: ", selectedRows);
    });

    $("#vbcPlanCode").change(function () {
        const vbcPlanCode = $("#vbcPlanCode").val();
        if (vbcPlanCode) {
            $("#validate-benefit-codes").prop('disabled', false);
        }
    });

    $('#testLogicModal').on('shown.bs.modal', function (e) {
        $('button[name="execute-test-logic-btn"]').attr('id', 'execute-test-logic');
        $('#execute-test-logic').click(function () {
            var planType = $("#planType").val();
            var planBCTLRuleV2IND = $("#planBCTLRuleV2IND").val();
            var planCode = $("#planCode").val();
            var rules = [];
            $("#childRules").find("tr.rules").each(function () {
                var rowId = this.id;
                if (rowId) rules.push(rowId.split("_")[1]);
            });
            if (planBCTLRuleV2IND && planCode && rules.length > 0) {
                var data = JSON.stringify({
                    planBCTLRuleV2IND: planBCTLRuleV2IND,
                    planCode: planCode,
                    childRuleIds: rules,
                    planType: planType
                });
                const url = basicPath + "/testBCTLVRuleV2Logic";
                $.ajax({
                    url: url,
                    type: "POST",
                    data: data,
                    contentType: "application/json"
                })
                    .then(function (res) {
                        $('#testLogicModal').modal('hide');
                        showCustomToast(res, false);
                    }).fail(function (error) {
                    console.log(error);
                });
            }
        });
    });

    $('#testLogicModal').on('hidden.bs.modal', function () {
        $('#planType').val('standardPlan');
        populatePlansDropdown('standardPlan');
    });

    //Validate Benefit Codes Modal Implimentation Logic
    $('#validateBenefitCodesModal').on('shown.bs.modal', function (e) {
        $('button[name="validate-benefit-codes-btn"]').attr('id', 'validate-benefit-codes');
        $('#ServiceCompSetID').prop('hide', true);

        // Remove any existing click event handlers
        $('#validate-benefit-codes').off('click');
        $('#validate-benefit-codes').click(function () {
            const vbcPlanType = $("#vbcPlanType").val();
            const vbcPlanCode = $("#vbcPlanCode").val();
            const segName = $("#segName").val();
            const cocName = $("#cocName").val();
            const state = $("#stateName").val();
            let digitalBenefitId = null;
            let planCode = vbcPlanCode;
            const ServCompSetSDataPointer = 115;

            if (vbcPlanType && vbcPlanCode && $(this).text() != 'Agree') {
                if (vbcPlanType === 'customPlan' && vbcPlanCode.includes('-')) {
                    planCode = vbcPlanCode.split('-')[0].trim();
                    digitalBenefitId = vbcPlanCode.split('-')[1].trim();
                }
                const data = JSON.stringify({
                    planCode: planCode,
                    planType: vbcPlanType,
                    dataPointerId: ServCompSetSDataPointer,
                    segment: segName,
                    cocSeries: cocName,
                    stateAbbr: state,
                    digitalBenefitId: digitalBenefitId
                });
                $('#vbcPlanCode').prop('readonly', true);
                $('#vbcPlanType').prop('disabled', true);
                $('#serviceCompSetDiv').show();
                const url = basicPath + "/executeValidateBenefitCodes";
                showAndHide();
                $.ajax({
                    url: url,
                    type: "POST",
                    data: data,
                    contentType: "application/json"
                }).then(function (res) {
                    showAndHide();
                    if (res) {
                        getBenefitCodes(res);
                    } else {
                        servCompSetIdError();
                    }
                }).fail(function (error) {
                    showAndHide();
                    servCompSetIdError();
                });
            }
        });
    });

    $('#validateBenefitCodesModal').on('hidden.bs.modal', function () {

        $('#vbcPlanType').val('standardPlan');
        populatePlansDropdown('standardPlan');
    });

    //Validate Tiers Modal Implimentation Logic
    $('#validateTiersModal').on('shown.bs.modal', function (e) {
        $('button[name="validate-Tier-btn"]').attr('id', 'validate-Tier');
        // Remove any existing click event handlers
        $('#validate-Tier').off('click');

        $('#validate-Tier').click(function () {

            const vncPlanType = $("#vncPlanType").val();
            const vncPlanCode = $("#vncPlanCode").val();
            const segName = $("#segName").val();
            const cocName = $("#cocName").val();
            const state = $("#stateName").val();
            const productBaseID = $("#productBaseId").val();
            let digitalBenefitId = null;
            let planCode = vncPlanCode;
            const netSchedulerDataPointer = 26;
            if (vncPlanType && vncPlanCode) {
                if (vncPlanType === 'customPlan' && vncPlanCode.includes('-')) {
                    planCode = vncPlanCode.split('-')[0].trim();
                    digitalBenefitId = vncPlanCode.split('-')[1].trim();
                }
                const data = JSON.stringify({
                    planCode: planCode,
                    planType: vncPlanType,
                    dataPointerId: netSchedulerDataPointer,
                    segment: segName,
                    cocSeries: cocName,
                    stateAbbr: state,
                    digitalBenefitId: digitalBenefitId,
                    productBaseId: productBaseID
                });
                const url = basicPath + "/executeValidateTiers";
                showAndHide();
                $.ajax({
                    url: url,
                    type: "POST",
                    data: data,
                    contentType: "application/json"
                }).then(function (res) {
                    showAndHide();
                    console.log("res: ", res);
                    validateTiers(res);
                }).fail(function (error) {
                    showAndHide();
                    $('#validateTiersModal').removeClass('show').css('display', 'none').attr('aria-hidden', 'true');
                    $('.modal-backdrop').remove();
                    $('body').removeClass('modal-open');
                    $('body').css('padding-right', '')
                });
            }
        });
    });

    $("#vncPlanCode").change(function () {
        const vncPlanCode = $("#vncPlanCode").val();
        if (vncPlanCode) {
            $("#validate-Tier").prop('disabled', false);
        }
    });

    $('#validateTiersModal').on('hidden.bs.modal', function () {
        $('#vncPlanType').val('standardPlan');
        populatePlansDropdown('standardPlan');
    });

    $("#vncPlanType").change(function () {
        const selected = $('#vncPlanType option:selected').val();
        populatePlansDropdown(selected);
    });

    function buildBctlvTable(ajaxData) {
        console.log("ajaxData: ", ajaxData);
        const isBenefitCodeToggle = $("#benefitCodeToggle").val() === "true";

        let bctlvDatatableColumns = [
            {
                "render": function (data, type, row) {
                    var checkbox = `<input type="checkbox" className="bctlvV2Checkbox" style="width: 50px" data-id="${row.planBCTLVRuleV2ID}" data-status="${row.status}" onclick="handleCheckboxClick(this)"/>`;
                    return checkbox;
                }
            },
            {
                "data": 'benefitCategory',
                "render": function (data, type, row) {
                    let bencatOptions = `<option value="${data}">${data || ''}</option>`;
                    ajaxData.benefitCategoryList.forEach(function (element) {
                        if (data !== element.benefitCategory) {
                            bencatOptions += `<option value="${element.benefitCategory}">${element.benefitCategory}</option>`;
                        } else {
                            console.log("data:", data);
                        }
                    });
                    return `<div id="dt-bencat-div-${row.planBCTLVRuleV2ID}" data-benefit-category="${data}" data-status="${row.status}" class="py-1 fixed-column-1 column1-cell bctlvV2Row"><select id="dt-bencat-select-${row.planBCTLVRuleV2ID}" data-bctlvv2-id="${row.planBCTLVRuleV2ID}" style="width: 205px" class="selectOption selectBenCat" title="${data}" onchange="onChangeBenefitCategory(this)">${bencatOptions}</select></div>`;
                }
            },
            {
                "data": 'paymentLine',
                "render": function (data, type, row) {
                    return `<div id="dt-paymentline-div-${row.planBCTLVRuleV2ID}"  class="py-1 fixed-column-2 bctlvV2Row"><select id="dt-paymentline-select-${row.planBCTLVRuleV2ID}" data-bctlvv2-id="${row.planBCTLVRuleV2ID}" class="selectOption" onchange="onChangePaymentLine(this)"><option value="${data}"/>${data || ''}</select></div>`
                }
            },
            {
                "data": 'tier',
                "render": function (data, type, row) {
                    return `<div id="dt-tier-div-${row.planBCTLVRuleV2ID}" class="py-1 fixed-column-3 column3-cell bctlvV2Row"><select id="dt-tier-select-${row.planBCTLVRuleV2ID}" class="selectOption"><option value="${data}"/>${data || ''}</select></div>`
                }
            },
            {
                "data": 'costShareOverrides',
                "render": function (data, type, row) {
                    let csoOptions = `<option value="${data}">${data}</option>`;
                    if(data != null && data !== "") {
                        csoOptions += `<option value=""></option>`;
                    }
                    ajaxData.costShareOverrides.forEach(function (element) {
                        if (data !== element) {
                            csoOptions += `<option value="${element}">${element}</option>`;
                        }

                    });
                    return `<div class="py-1 fixed-column-3 column3-cell bctlvV2Row"><select id="dt-cso-select-${row.planBCTLVRuleV2ID}" class="selectOption">${csoOptions}</select></div>`;
                }
            },
            {
                "data": 'category',
                "render": function (data, type, row, meta) {
                    return `<div class="dt-category" contenteditable="true" data-row="${meta.row}" data-field="category">${data || ''}</div>`;
                }
            },
            {
                "data": 'benefitCode',
                "render": function (data, type, row, meta) {
                    return `<div class="dt-benefit-code" contenteditable="true" data-row="${meta.row}" data-field="benefitCode" oninput="enforceMaxLength(event, 60)">${data || ''}</div>`;
                }
            },
            {
                "data": 'referencePlaceOfService',
                "render": function (data, type, row, meta) {
                    return `<div class="dt-rpos" contenteditable="true" data-row="${meta.row}" data-field="referencePlaceOfService">${data || ''}</div>`;
                }
            },
            {
                "data": 'plan_Tier',
                "render": function (data, type, row, meta) {
                    return `<div id="dt-plantier-div-${row.planBCTLVRuleV2ID}" data-row="${meta.row}" data-field="plan_Tier" data-toggle="modal" class="open-modal" data-value="PlanTier"
                                    data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.tier}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',3)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'level',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="level" data-toggle="modal" class="open-modal" data-value="Level"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.level}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',2)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'version',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="version" data-toggle="modal" class="open-modal" data-value="Version"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.version}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',1)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'network_Name',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="networkName" data-toggle="modal" class="open-modal" data-value="NetworkName"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.network_Name}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',24)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'providerDesignation',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="providerDesignation" data-toggle="modal" class="open-modal" data-value="ProviderDesignation"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.providerDesignation}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',27)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'qualityTierValue',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="qualityTierValue" data-toggle="modal" class="open-modal" data-value="QualityTierValue"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.qualityTierValue}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',37)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'effectiveDate',
                "render": function (data, type, row, meta) {
                   return `<input class="effDateInput selectOption" type="date" value='${row.effectiveDate != null ? row.effectiveDate : ""}'>`;
                   }
            },
            {
                "data": 'expirationDate',
                "render": function (data, type, row, meta) {
                    return `<input class="expDateInput selectOption" type="date" value='${row.expirationDate != null ? row.expirationDate : ""}'>`;
                }
            },
            {
                "data": 'max_CopaymentsDT',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="max_CopaymentsDT" data-toggle="modal" class="open-modal" data-value="MaxCopaymentsDT"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.max_CopaymentsDT}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',4)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'max_CopaymentsQty',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="max_CopaymentsQty" data-toggle="modal" class="open-modal" data-value="MaxCopaymentsQty"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.max_CopaymentsQty}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',5)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'max_Copayments',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="max_Copayments" data-toggle="modal" class="open-modal" data-value="MaxCopayments"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.max_Copayments}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',6)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'state',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="state" data-toggle="modal" class="open-modal" data-value="State"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.state}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',7)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'dollar_Range_Type',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="dollar_Range_Type" data-toggle="modal" class="open-modal" data-value="DollarRangeType"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.dollar_Range_Type}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',8)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'dollar_Range_For_Every_Duration',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="dollar_Range_For_Every_Duration" data-toggle="modal" class="open-modal" data-value="DollarRangeForEveryDuration"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.dollar_Range_For_Every_Duration}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',9)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'dollar_Range_For_Every',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="dollar_Range_For_Every" data-toggle="modal" class="open-modal" data-value="DollarRangeForEvery"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.dollar_Range_For_Every}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',10)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'dollar_Range_Thru',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="dollar_Range_Thru" data-toggle="modal" class="open-modal" data-value="DollarRangeThru"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.dollar_Range_Thru}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',11)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'dollar_Range_From',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="dollar_Range_From" data-toggle="modal" class="open-modal" data-value="DollarRangeFrom"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.dollar_Range_From}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',12)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'occurrence_For_Every_Duration',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="occurrence_For_Every_Duration" data-toggle="modal" class="open-modal" data-value="OccurrenceForEveryDuration"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.occurrence_For_Every_Duration}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',13)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'occurrence_For_Every',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="occurrence_For_Every" data-toggle="modal" class="open-modal" data-value="OccurrenceForEvery"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.occurrence_For_Every}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',14)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'occurrence_Thru',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="occurrence_Thru" data-toggle="modal" class="open-modal" data-value="OccurrenceThru"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.occurrence_Thru}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',15)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'occurrence_From',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="occurrence_From" data-toggle="modal" class="open-modal" data-value="OccurrenceFrom"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.occurrence_From}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',16)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'relationship_Limit',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="relationship_Limit" data-toggle="modal" class="open-modal" data-value="RelationshipLimit"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.relationship_Limit}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',17)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'age_Limit_Thru',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="age_Limit_Thru" data-toggle="modal" class="open-modal" data-value="AgeLimitThru"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.age_Limit_Thru}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',18)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'age_Limit_From_Duration_Type',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="age_Limit_From_Duration_Type" data-toggle="modal" class="open-modal" data-value="AgeLimitFromDurationType"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.age_Limit_From_Duration_Type}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',20)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": "age_Limit_Thru_Duration_Type",
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="age_Limit_Thru_Duration_Type" data-toggle="modal" class="open-modal" data-value="AgeLimitFromDurationType"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.age_Limit_Thru_Duration_Type}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',19)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'age_Limit_From',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="age_Limit_From" data-toggle="modal" class="open-modal" data-value="AgeLimitFrom"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.age_Limit_From}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',21)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'placeOfService',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="placeOfService" data-toggle="modal" class="open-modal" data-value="PlaceOfService"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.placeOfService}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',28)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'billTypeSetCategory',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="billTypeSetCategory" data-toggle="modal" class="open-modal" data-value="BillTypeSetCategory"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.billTypeSetCategory}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',29)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'assignedBenefitCodes',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="assignedBenefitCodes" data-toggle="modal" class="open-modal" data-value="AssignedBenefitCodes"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.assignedBenefitCodes}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',30)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'coverageConditionType',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="coverageConditionType" data-toggle="modal" class="open-modal" data-value="CoverageConditionType"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.coverageConditionType}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',25)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'memberIndicator',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="memberIndicator" data-toggle="modal" class="open-modal" data-value="MemberIndicator"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.memberIndicator}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',26)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'serviceAreaType',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="serviceAreaType" data-toggle="modal" class="open-modal" data-value="ServiceAreaType"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.serviceAreaType}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',31)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'benefitIsNotCoveredByBCTLVDRC',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="benefitIsNotCoveredByBCTLVDRC" data-toggle="modal" class="open-modal" data-value="BenefitIsNotCoveredByBCTLVDRC"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.benefitIsNotCoveredByBCTLVDRC}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',34)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'elevatedBenefit',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="elevatedBenefit" data-toggle="modal" class="open-modal" data-value="ElevatedBenefit"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.elevatedBenefit}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',32)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'serviceTypeCode',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="serviceTypeCode" data-toggle="modal" class="open-modal" data-value="ServiceTypeCode"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.serviceTypeCode}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',33)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'relationshipCode',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="relationshipCode" data-toggle="modal" class="open-modal" data-value="RelationshipCode"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.relationshipCode}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',35)">${data || '&nbsp;'}</div>`;
                }
            },
            {
                "data": 'costShareAccum',
                "render": function (data, type, row, meta) {
                    return `<div data-row="${meta.row}" data-field="costShareAccum" data-toggle="modal" class="open-modal" data-value="CostShareAccum"
                                data-target="#multiRuleModal" onclick="loadBctlvChildRule(this,'${row.paymentLine}','${row.costShareAccum}','${row.planBCTLVRuleV2ID}','${row.cBBProductBaseID}',36)">${data || '&nbsp;'}</div>`;
                }
            }
        ];
        const statusIndex = 1;
        const statusColumn = {
            "data": 'status',
            "render": function (data, type, row) {
                var statusCell = "";
                if (data === "1") {
                    statusCell = '<div class="text-center"><i class="fa-solid fa-triangle-exclamation fa-xl" title="Benefit code should be added to the BCTLV." style="color: #FFD43B;"></i></div>';
                } else if (data === "2") {
                    statusCell = '<div class="text-center"><i class="fa-solid fa-circle-exclamation fa-xl" title="Benefit code should be removed from the BCTLV." style="color: #dc3545;"></i></div>';
                } else {
                    statusCell = '<div class="text-center" id="status_cell"></div>';
                }
                return statusCell;
            }
        };
        if (isBenefitCodeToggle) {
            bctlvDatatableColumns.splice(statusIndex, 0, statusColumn);
        }

        let dtOptions = {
            "data": ajaxData.bctlvData,
            "paging": true,
            "scrollCollapse": true,
            "scrollY": '60vh',
            "scrollX": true,
            "columnDefs": [
                {
                    "targets": isBenefitCodeToggle ? [0,1] : 0,
                    "searchable": false,
                    "defaultContent": "-",
                    "createdCell": function (td, cellData, rowData, row, col) {
                        $(td).addClass('bctlv-cell-default');
                    }
                },
                {
                    "targets":isBenefitCodeToggle ? [0,1,2,3,4,5,6] : [0,1,2,3,4,5],
                    "orderable": true,
                    "searchable": true,
                },
                {
                    "targets": isBenefitCodeToggle ? 7 : 6,
                    "createdCell": function (td, cellData, rowData, row, col) {
                        if (rowData.benefitCategory === null || rowData.benefitCategory === ''){
                            if (rowData.benefitCode !== null || rowData.benefitCode !== ''){
                                $(td).addClass('bctlv-cell-warning');
                            } else {
                                $(td).addClass('bctlv-cell-error');
                            }
                        } else {
                            switch (rowData.status) {
                                case "1": {
                                    $(td).addClass('bctlv-cell-warning');
                                    break;
                                }
                                case "2": {
                                    $(td).addClass('bctlv-cell-error');
                                    break;
                                }
                            }
                        }
                    }
                },
                {
                    "targets": isBenefitCodeToggle ? 9 : 8,
                    "createdCell": function (td, cellData, rowData, row, col) {
                        if (rowData.benefitCategory === null || rowData.benefitCategory === ''){
                            if (rowData.planBCTLVRuleV2ID === "null"){
                                $(td).addClass('plan_tier_td_id_'+ rowData.planBCTLVRuleV2ID);
                            } else {
                                $(td).addClass('bctlv-cell-error');
                            }
                        }
                        else {
                            $(td).addClass('plan_tier_td_id_'+ rowData.planBCTLVRuleV2ID);
                        }
                    }
                },
                {
                    "targets": "_all",
                    "orderable": false,
                    "searchable": true,
                    "createdCell": function (td, cellData, rowData, row, col) {
                        if (rowData.benefitCategory === null || rowData.benefitCategory === ''){
                            $(td).addClass('bctlv-cell-error');
                        }
                    }
                },

            ],
            "order": [[isBenefitCodeToggle ? 7 : 6, 'asc']],
            "fixedColumns": {
                left: isBenefitCodeToggle ? 7 : 6
            },
            "columns": bctlvDatatableColumns
        };

        bctlvDatatable = $('#pocBctlvTable').DataTable(dtOptions);
        bindSearchCharacterLimit(bctlvDatatable);
        bindContextMenu();
    }
	removeErrorCodes();
});

function bindSearchCharacterLimit(bctlvDatatable) {
	// Grab the datatables input box and alter how it is bound to events
	$("#pocBctlvTable_filter input").unbind().bind("input", function(e) {
		// If the length is 3 or more characters, or the user pressed ENTER, search
		if(this.value.length >= 3 || e.keyCode == 13) {
            console.log("search value: ", this.value);
            bctlvDatatable.search(this.value).draw();
		}
		// Ensure we clear the search if they backspace far enough
		if(this.value == "") {
            bctlvDatatable.search("").draw();
		}
		return;
	});
}

function bindContextMenu() {
	$("#pocBctlvTableBody").contextmenu(function(e) {
		e.preventDefault();
		var menu = $("#contextMenu");
		menu.css({
			top: e.pageY,
			left: e.pageX
		}).show();
		document.addEventListener('click', hideContextMenuPoc);
	});
}

function onChangeBenefitCategory(selectElement) {
    const selectedCategoryData = bctlvAjaxData.benefitCategoryList.find(function (item) {
        return item.benefitCategory === selectElement.value;
    });
    let cellID = selectElement.getAttribute('data-bctlvv2-id');
    populatePaymentLineAndTier(selectedCategoryData, cellID);
}

function onChangePaymentLine(selectElement) {
    let paymentLines = selectElement.getAttribute("td-payment-lines-data");
    const paymentLineOptions = JSON.parse(paymentLines);
    const cellID = selectElement.getAttribute('data-bctlvv2-id');
    const tierSelect = $("#dt-tier-select-" + cellID);
    const selectedPaymentLine = paymentLineOptions.find(function (item) {
        return item["paymentLineValue"] === selectElement.value;
    });
    populateTier(selectedPaymentLine, tierSelect);
}

function populateTier(paymentLineData, tierSelect) {
    console.log(paymentLineData);
    if (paymentLineData) {
        const tiersData = paymentLineData["benefitTiers"];
        if (tiersData && tiersData.length > 0) {
            tierSelect.prop("disabled", false);
            tierSelect.empty();
            tierSelect.append('<option value=""></option>');
            tiersData.forEach(function (tier) {
                tierSelect.append('<option value="' + tier.tierNumber + '">' + tier.tierNumber + '</option>');
            });
        } else {
            tierSelect.prop("disabled", true);
        }
    } else {
        tierSelect.empty();
        tierSelect.prop("disabled", true);
    }
}

function populatePaymentLineAndTier(selectedCategoryData, cellID) {
    const paymentLinesData = selectedCategoryData["paymentLines"];
    const paymentLineSelect = $("#dt-paymentline-select-" + cellID);
    const tierSelect = $("#dt-tier-select-" + cellID);
    if (paymentLinesData && paymentLinesData.length > 0) {
        paymentLineSelect.prop("disabled", false);
        paymentLineSelect.empty();
        paymentLineSelect.attr("td-payment-lines-data", JSON.stringify(paymentLinesData));
        tierSelect.empty();
        paymentLineSelect.append('<option value=""></option>');
        paymentLinesData.forEach(function (paymentLine) {
            populateTier(paymentLine, tierSelect)
            paymentLineSelect.append('<option value="' + paymentLine.paymentLineValue + '">' + paymentLine.paymentLineValue + '</option>');
        });
    } else {
        paymentLineSelect.empty();
        tierSelect.empty();
        paymentLineSelect.prop("disabled", true);
        tierSelect.prop("disabled", true);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const tds = document.querySelectorAll('td[data-benefit-category]');

    tds.forEach(td => {
        const benefitCategory = td.getAttribute('data-benefit-category');
        const status = td.getAttribute('data-status');

        if (status === '1') {
            td.style.backgroundColor = 'yellow';
            td.style.color = 'black';
        } else if ((benefitCategory === null || benefitCategory === '') || status === '2') {
            td.style.backgroundColor = 'red';
            td.style.color = 'white';
        } else {
            td.style.backgroundColor = '';
            td.style.color = '';
        }
    });
});
function validateTiers(res) {
    $('#validateTiersModal').removeClass('show').css('display', 'none').attr('aria-hidden', 'true');
    $('.modal-backdrop').remove();
    $('body').removeClass('modal-open');
    $('body').css('padding-right', '')
   console.log("validateTiers response: ", res);
    handleTierValidationResponse(res);
}

function handleTierValidationResponse(res) {
	if (res && res.ruleResultList!=null) {
        showTierValidationResultPopUp(res.planTierSuccessful);
        console.log("Tier Validation Response: ", res.ruleResultList);
        orderData(res);
    } else {
        showMultipleNetSchedularIdsError(res.errorMessage);
        console.log("Response is empty or null");
        return;
    }
}

//function to show tiervalidation result message
function showTierValidationResultPopUp(isPlanTierSuccessful){
    if(isPlanTierSuccessful){
        validateCustomToast("Validation errors have been highlighted.");
    }else{
        validateCustomToast("No validation errors found for configured Plan Tiers.");
    }
}

// Validation popup for multiple network schedular ids
function showMultipleNetSchedularIdsError(errorMessage){
     if(errorMessage!=null &&errorMessage === "Multiple Network Schedule IDs have been configured. Please review this configuration and retry."){
        validateCustomToast(errorMessage);
    }
}

function orderData(res) {
    let ruleResultList = res.ruleResultList;
    const orderedIds = ruleResultList.map(item => item.planBCTLVRuleV2ID);
    if ($.fn.DataTable.isDataTable('#pocBctlvTable')) {
    $('#pocBctlvTable').DataTable().destroy();
    }

    const table = $('#pocBctlvTable').DataTable({
    retrieve: true,
    paging: true,
    searching: false,
    ordering: false
    });

    table.clear();

    const rows = Array.from(table.rows().nodes());
    const filteredRows = rows.filter(row => {
    const id = $(row).find('td.plan_tier_td_id_' + item.planBCTLVRuleV2ID).length > 0;
    })

    filteredRows.sort((a, b) => {
    const idA = $(a).find('td.plan_tier_td_id_' + item.planBCTLVRuleV2ID).text();
    const idB = $(b).find('td.plan_tier_td_id_' + item.planBCTLVRuleV2ID).text();
    return orderedIds.indexOf(idA) - orderedIds.indexOf(idB);
    });

    filteredRows.forEach(row => {
    $(row).find('td.plan_tier_td_id_' + item.planBCTLVRuleV2ID).setAttribute('data-plan-bctlv-rule-id', item.planBCTLVRuleV2ID);

    table.rows.add(filteredRows);
    table.draw(false);
    });
    console.log("Filtered Rows: ", orderedIds);
    colorRowForTier(res.ruleResultList);
}
function colorRowForTier(dataList) {
   let redRowCount = 0;
       let yellowRowCount = 0;
       let greenRowCount = 0;
       dataList.forEach((data) => {
           if(data.rowColor === 'YELLOW'){
               const cell1 = document.getElementsByClassName("plan_tier_td_id_" + data.planBCTLVRuleV2ID);
               console.log("cell1: ", cell1);
               const $cell = $(cell1);
               setCellColor($cell, 'yellow', 'black');
               $row = $cell.closest('tr');
               addStatusIcon($row,'yellow');
               yellowRowCount++;
           }
           if(data.rowColor === 'RED'){
               const cell1 = document.getElementsByClassName("plan_tier_td_id_" + data.planBCTLVRuleV2ID);
               const $cell = $(cell1);
               setCellColor($cell, 'red', 'white');
               $row = $cell.closest('tr');
               addStatusIcon($row,'red');
               redRowCount++;
           }
           if(data.rowColor === 'GREEN'){
               const cell1 = document.getElementsByClassName("plan_tier_td_id_" + data.planBCTLVRuleV2ID);
               const $cell = $(cell1);
               setCellColor($cell, '#45d1ac', 'black');
               greenRowCount++;
           }
           if(data.rowColor == null || data.rowColor == ''){
               const cell1 = document.getElementsByClassName("dt-plantier-div-" + data.planBCTLVRuleV2ID);
               const $cell = $(cell1);
               setCellColor($cell, 'white', 'black');
               $row = $cell.closest('tr');
               addStatusIcon($row,'white');
           }
       });
       colorCountBTV(yellowRowCount, redRowCount, greenRowCount);
   }
function setCellColor($cell, backgroundColor,fontColor) {
    $cell.css({
        'background-color': backgroundColor,
        'color': fontColor
    });
}
function addStatusIcon($row,color) {
   $row.find('#status_cell').empty();
        if(color === 'yellow'){
           $row.find('#status_cell').append('<i class="fa-solid fa-triangle-exclamation fa-lg" style="color: #FFD43B;" title="Plan tier(s) needs be added to the BCTLV."></i>');
        }
        if(color === 'red'){
            $row.find('#status_cell').append('<i class="fa-solid fa-circle-exclamation fa-lg" style="color: red;" title="Plan tier should be removed from the BCTLV."></i>');
        }
}
//color count in the icon
function colorCountBTV(yellowRowCount, redRowCount, greenRowCount) {
//clear if any existing count data
    $('#bcErrorCount').remove();
    $('#yellowIcon').empty();
    $('#redIcon').empty();
    $('#greenIcon').empty();
    if (yellowRowCount > 0) {
        const div = document.getElementById('yellowIcon');
        $(div).empty();
        $(div).append('<i class="fas fa-exclamation-triangle me-1 mt-2" style="color:#ffa200 !important;font-size:larger;"></i>' +
            '<span class="fw-bold fs-5">' + yellowRowCount + '</span>');
    }
    if (redRowCount > 0) {
        const div = document.getElementById('redIcon');
        $(div).empty();
        $(div).append('<i class="fas fa-exclamation-circle me-1 mt-2 ml-3" style="color:red !important;font-size:larger;"></i>' +
            '<span class="fw-bold fs-5">' + redRowCount + '</span>')
    }
    if (greenRowCount > 0) {
        const div = document.getElementById('greenIcon');
        $(div).empty();
        $(div).append('<i class="fas fa-arrow-up-1-9 me-1 mt-2 ml-3" style="color:#45d1ac !important;font-size:larger;"></i>' +
            '<span class="fw-bold fs-5">' + greenRowCount + '</span>')
    }
}

function getBenefitCodes(res) {
     const successMsg = " was returned from ServCompSetID rules execution. Use this ServCompSetID to validate Benefit Codes?"
    const serviceCompSetID = res;
	const proBaseId = $('#productBaseId').val();
	let isAgreeButtonClicked = false;
	$('#ServiceCompSetID').val(res.value);
	$('#blankSpace').removeClass('col-2').addClass('col-4');
	$('#cancel-button').closest('div').removeClass('col-4').addClass('col-4');
	$('#validate-benefit-codes').closest('div').removeClass('col-6').addClass('col-4');
	$('#cancel-button').text('Disagree');
	$('#validate-benefit-codes').text('Agree')
	.click( function() {
		//To retain the errorCodeList on the first load of the page
		sessionStorage.setItem('isAgreeButtonClicked', 'true');
        $.ajax({
           url: basicPath + '/getServCompSetBenefitCodes',
           type: 'GET',
           data: {
               servCompSetID: serviceCompSetID,
               productBaseID: proBaseId
           },
           success: function(response, textStatus, xhr) {
                const benefitErrorCodesList = response.benefitErrorCodes.length;
                const statusCode = xhr.status;
                handleResponse(benefitErrorCodesList, statusCode);
                $('#validateBenefitCodesModal').hide();
           },
           error: function(error) {
               console.log('getServCompSetBenefitCodes API call failed:', error);
           }
       });
    });
	$('#cancel-button').text('Disagree').on('click', function() {
		revertvalidateTiersModal();
	});
	$('#serviceCompSetDiv').append('<p>' + serviceCompSetID + successMsg +'</p>');
}

function servCompSetIdError() {
    const errorMsg = 'This plan does not return a ServCompSetID, please check the template rules.';
    $('#cancel-button').text('Close');
    $('#validate-benefit-codes').hide();
    $('#cancel-button').closest('div').removeClass('col-4').addClass('col-12');
    $('#cancel-button').on('click', closeOutput);
    $('#serviceCompSetDiv').append('<p>' + errorMsg + '</p>');
    $('#cancel-button').text('Close').on('click', function () {
        $('#cancel-button').closest('div').removeClass('col-12').addClass('col-4');
        $('#validate-benefit-codes').show();
        revertvalidateTiersModal();
    });
    $(document).on('click', '.close[data-dismiss="modal"]', function () {
        $('#cancel-button').closest('div').removeClass('col-12').addClass('col-4');
        $('#validate-benefit-codes').show();
        revertvalidateTiersModal();
    });
}

//Revert All the inputs in the modal
function revertvalidateTiersModal() {
    $('#vbcPlanCode').val('');
    $('#vbcPlanType').val('');
    $('#ServiceCompSetID').val('');
    $('#serviceCompSetDiv').hide();
    $('#serviceCompSetDiv p').remove();
    $('#serviceCompSetDiv').css('display', 'none');
    $('#vbcPlanCode').prop('readonly', false);
    $('#vbcPlanType').prop('disabled', false);
    $('#cancel-button').text('Cancel');
    $('#validate-benefit-codes').text('Retrieve ServCompSetID');
    $('#blankSpace').removeClass('col-4').addClass('col-2');
    $('#cancel-button').closest('div').removeClass('col-4').addClass('col-4');
    $('#validate-benefit-codes').closest('div').removeClass('col-4').addClass('col-6');
}

function handleResponse(benefitErrorCodesList, statusCode) {
    $('#validate-benefit-codes').removeClass('show').css('display', 'none').attr('aria-hidden', 'true');
    $('.modal-backdrop').remove();
	$('body').removeClass('modal-open');
	$('body').css('padding-right', '')
	    if(benefitErrorCodesList===0){
            if (statusCode === 404) {
                validateCustomToast("No active service component was identified in Cirrus based on the ServCompSetID.");
            } else if (statusCode === 504) {
                validateCustomToast("Cirrus service is currently unavailable to retrieve the active benefit codes. Please try again.");
            } else if (statusCode === 500) {
                validateCustomToast("Error was encountered. Please try again.");
            } else if (statusCode === 200) {
                validateCustomToast("Benefit Codes configured on the template have all been accounted for based on the ServCompSetID.");
            }
        } else {
            window.location.reload();
			sessionStorage.removeItem('isAgreeButtonClicked');
        }
}

function prepareChildRuleAddModal(e) {
    $('#whenQueryBuilder').queryBuilder('destroy');
    $('#thenQueryBuilder').queryBuilder('destroy');
    loadQueryBuilders();
}

function populatePlansDropdown(planType) {
    var cocSeries = $("#cocName").val();
    var orgName = $("#orgName").val();
    var state = $("#stateName").val();
    var segment = $("#segName").val();
    var product = $("#prodName").val();
    var standard = $("#stdName").val();

    if (planType) {

        const url = basicPath + "/fetchStandardOrCustom";

        var data = JSON.stringify({
            planType: planType,
            cocSeries: cocSeries,
            orgName: orgName,
            state: state,
            segment: segment,
            product: product,
            standard: standard
        });

        $.ajax({
            url: url,
            type: 'POST',
            data: data,
            contentType: "application/json",
            datatype: 'JSON'
        }).then(
            function (plans) {
                if (plans) {
                    var planContent = '';
                    plans
                        .forEach(function (planObj) {
                            planContent += `
							<option
								id="${planObj.id}"
								name="${planObj.planCode}">
								${planObj.planCode}${planType == 'customPlan' ? ' - ' + planObj.id : ''}
							</option>`
                        });

                    $("#medicalPlansList").find("option").remove().end()
                        .append(planContent);
                }
            });
    }
}

function showCustomToast(response, updateIndicator) {
    var success = document.getElementById("successCustom");
    if (!updateIndicator) {
        if (response != "") {
            document.getElementById("successCustomMessage").innerHTML = response;
        } else {
            document.getElementById("successCustomMessage").innerHTML = 'Test results returned <i>Empty</i>';
        }
    } else {
        document.getElementById("successCustomMessage").innerHTML = 'Plan/s updated : '
            + response + '';
        document.getElementsByClassName("toast-header")[0].innerHTML = '<strong class="mr-auto text-primary"> ' +
            '<i class="fas fa-square" style="color: #00a550"></i> Result </strong><button type="button" class="ml-2 mb-1 close"' +
            ' data-dismiss="toast">&times;</button>';
    }
    success.className = 'show';
}

function validateCustomToast(response) {
    const success = document.getElementById("successCustom");
    document.getElementById("successCustomMessage").innerHTML = response;
    document.getElementsByClassName("toast-header")[0].innerHTML = '<strong class="mr-auto text-primary"> ' +
        '<i class="fas fa-square" style="color: #00a550"></i>' + '&nbsp;' + 'Validation Successful </strong><button type="button" class="ml-2 mb-1 close"' +
        ' data-dismiss="toast" onclick="closeOutput()">&times;</button>';
    success.className = 'show';
}

function closeOutput() {
    $("#successCustom").toast('hide');
}

function cloneTo(rowData, bctlvTableData) {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    const payload = {
        id: id,
        rowData: rowData,
        mainBctlvTableData: bctlvTableData
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/cbb-ui/cloneTo', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            console.log(xhr.responseText);
            showAndHide();
            alert("Data Cloned Successfully");
            const response = JSON.parse(xhr.responseText);
            console.log(response);
        }
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200) {
            showAndHide();
            alert("Data Cloning failed");
        }
    };
    xhr.send(JSON.stringify(payload));
}

function cloneBCTLV() {
    const roleId = document.getElementById('roleId').value;
    const cloneFromStateValue = $("#stateName").val();

    if (isContextMenu) {
        showAndHide();
        const selectedTemplateRows = document.querySelectorAll('.selectRow:checked');
        const rowData = [];
        if (selectedTemplateRows.length === 0) {
            alert('Please select at least 1 template');
        } else {
            selectedTemplateRows.forEach((row) => {
                const cells = row.closest('tr').querySelectorAll('td');
                const data = Array.from(cells).map((cell) => {
                    if (cell.querySelector('select')) {
                        return cell.querySelector('select').value;
                    }
                    if (cell.querySelector('#hsaId')) {
                        return cell.querySelector('input[name=hsa]').checked + "" // convert boolean to string
                    }
                    return cell.textContent;
                });
                rowData.push(data);
            });
            const productBaseId = bctlvUrlParams.get("id");
            const cloneData = {
                ruleIds: selectedRows.map(row => row.ruleId),
                modalData: rowData,
                id: productBaseId
            };
            $.ajax({
                type: "POST",
                url: basicPath + "/cloneRecord",
                data: JSON.stringify(cloneData),
                contentType: "application/json",
                success: function (response) {
                    showAndHide();
                    alert("Data Cloned Successfully");
                    isContextMenu = false;
                },
                error: function (error) {
                    showAndHide();
                    alert("Data Cloning failed");
                    isContextMenu = false;
                }
            });
        }

    } else {
        showAndHide();
        const selectedRows = document.querySelectorAll('.selectRow:checked');
        const rowData = [], cloneToStateValues = [];

		if (selectedRows.length === 0) {
			alert('Please select at least 1 template');
			showAndHide();
		} else {
			selectedRows.forEach((row) => {
				const cells = row.closest('tr').querySelectorAll('td');
				const data = Array.from(cells).map((cell) => {
					if (cell.querySelector('select')) {
						return cell.querySelector('select').value;
					}
					if (cell.querySelector('#hsaId')) {
						return cell.querySelector('input[name=hsa]').checked + "" // convert boolean to string
					}
					return cell.textContent;
				});
				// Collecting only states from the data array
                cloneToStateValues.push(data[2]);
                rowData.push(data);
            });

            const mainBctlvTableRows = document.querySelectorAll('#mainBctlvTable tbody tr');
            const mainBctlvTableData = [];

			mainBctlvTableRows.forEach((row) => {
			    var effectiveDate =   $(row).find('.effDateRow').val() != "" ? $(row).find('.effDateRow').val() : $(row).find('.effDateInput').val();
                var expirationDate =  $(row).find('.expDateRow').val() != "" ? $(row).find('.expDateRow').val() : $(row).find('.expDateInput').val();
				const checkbox = row.querySelector('input[type="checkbox"]');
				const planBCTLVRuleV2Id = checkbox.dataset.id;
				const referencePlaceOfService = $(row).find('.rposRow').text();
				const cells = row.querySelectorAll('td:nth-child(n+2):nth-child(-n+8)');
				const data = Array.from(cells).map((cell) => {
					if (cell.querySelector('select')) {
						return cell.querySelector('select').value;
					}
					return cell.textContent;
				});
				data.push(effectiveDate);
				data.push(expirationDate);
				data.push(referencePlaceOfService);
				data.unshift(planBCTLVRuleV2Id);
				mainBctlvTableData.push(data);
			});

            // RoleIds of IT_Support and SuperUser
            if (roleId == 4 || roleId == 6) {
                cloneTo(rowData, mainBctlvTableData);
            } else if (cloneFromStateValue === "NA") {
                cloneTo(rowData, mainBctlvTableData);
            } else {
                var stateFlag = true;
                for (var i = 0; i < cloneToStateValues.length; i++) {
                    if (cloneToStateValues[i] !== "NA" && cloneToStateValues[i] !== cloneFromStateValue) {
                        stateFlag = false;
                    }
                }
                if (stateFlag) {
                    cloneTo(rowData, mainBctlvTableData);
                } else {
                    showAndHide();
                    $("#cloneModal").modal("hide");
                    $("#validateStateErrorModal").modal("show");
                }
            }
        }
    }
}

var basicPath = "/cbb-ui";
var columnId;
var isContextMenu = false;

function loadBctlvChildRule(benefitCategory, paymentLine, tier, planBCTLRuleV2IND, cBBProductBaseID, columnId) {
    const columnName = $(benefitCategory).data('value');
    $('#columnName').text(columnName);

    var benefit = benefitCategory.getAttribute('benefitCategory');
    $('#benefitCategory').val(benefit);
    $('#paymentLine').val(paymentLine);
    $('#tier').val(tier);
    $('#planBCTLRuleV2IND').val(planBCTLRuleV2IND);
    $('#cBBProductBaseID').val(cBBProductBaseID);
    $('#columnId').val(columnId);
    $('#childRules').html('');
    loadChildRules(cBBProductBaseID)
    unbindBeforeUnload(event);

    //$('#pasteRuleId').prop('disabled', true);
    $('#copyRuleId').prop('disabled', true);
    const sessionRulesData = localStorage.getItem("childRulesCopiedLocalData");
    if (sessionRulesData != null) {
        $('#pasteRuleId').prop('disabled', false);
    } else {
        $('#pasteRuleId').prop('disabled', true);
    }
}

function saveBctlvChildRule(ruleId) {
    const columnId = $("#columnId").val();
    var thenLogic = '';
    var whenLogic = '';

    if (ruleId == '0') {
        thenLogic = $('#thenQueryBuilder').queryBuilder('getRules');
        whenLogic = $('#whenQueryBuilder').queryBuilder('getRules');
    } else {
        thenLogic = $('#thenQueryBuilder_' + ruleId).queryBuilder('getRules');
        whenLogic = $('#whenQueryBuilder_' + ruleId).queryBuilder('getRules');
    }

    // Elevated Benefit: alert if value is not 1 or 0
    if (columnId === "32") {
        if (thenLogic.rules[0].value !== "1" && thenLogic.rules[0].value !== "0") {
            alert('Elevated Benefits field only allows 1 or 0');
            return;
        }
    }

    if (thenLogic) {
        var childRule = JSON.stringify({
            ruleLogicWhen: whenLogic,
            ruleLogicThen: thenLogic
        });
        $.ajax({
            url: basicPath + "/saveBctlvChildRule",
            type: "post",
            datyaType: "json",
            data: childRule,
            contentType: "application/json"
        }).then(
            function (childRule) {
                $('#childRuleModal').css('display', 'none');
                if (childRule) {
                    if (childRule.length == 0) {
                        $("#delete-allChildRules-main")
                            .addClass('disabled');
                    } else {
                        $("#delete-allChildRules-main").removeClass(
                            'disabled');
                    }
                    if (ruleId) {
                        if (ruleId != childRule.ruleId) {
                            // Remove row with ruleId
                            displayChildRule(ruleId, childRule);
                            deleteChildRule(ruleId);
                        }
                    } else {
                        displayChildRule('', childRule);
                    }
                    loadQueryBuilders();
                    setTimeout(function () {
                        if (childRule.ruleLogicWhen && "null" != childRule.ruleLogicWhen) {
                            $('#whenQueryBuilder_' + childRule.ruleId)
                                .queryBuilder('setRules',
                                    childRule.ruleLogicWhen);
                        }
                        $('#thenQueryBuilder_' + childRule.ruleId)
                            .queryBuilder('setRules',
                                childRule.ruleLogicThen);
                    }, 2000);
                    $('#unsavedChanges').val('true');
                }
            }).fail(function (data) {
            alert('Error occurred while saving data');
            console.log(data);
        });
    }
}

function saveRuleLogicDetail() {
    const benefitCategory = $("#benefitCategory").val();
    const paymentLine = $("#paymentLine").val();
    const tier = $("#tier").val();
    const planBCTLRuleV2IND = $("#planBCTLRuleV2IND").val();
    const cBBProductBaseID = $("#cBBProductBaseID").val();
    const columnId = $("#columnId").val();
    const rules = new Set();
    $("#childRules").find("tr.rules").each(function () {
        var rowId = this.id;
        if (rowId)
            rules.add(rowId.split("_")[1]);
    });
    const rulesList = Array.from(rules);
    if (planBCTLRuleV2IND && cBBProductBaseID && columnId) {
        var childRuleLogicDetail = JSON.stringify({
            benefitCategory: benefitCategory,
            paymentLine: paymentLine,
            tier: tier,
            planBCTLRuleV2IND: planBCTLRuleV2IND,
            cBBProductBaseID: cBBProductBaseID,
            columnId: columnId,
            rules: rulesList
        });
        $.ajax({
            url: basicPath + "/saveBctlvChildRuleLogic",
            type: "post",
            datyaType: "json",
            data: childRuleLogicDetail,
            contentType: "application/json"
        }).then(
            function (childRuleLogicDetail) {
                $('#unsavedChanges').val('false');
                window.onbeforeunload = null;
                window.location.reload();
            }).fail(function (data) {
            window.onbeforeunload = null;
            window.location.reload();
            console.log(data);
        });
    }
}

function loadChildRules(cBBProductBaseID) {
    const planBCTLRuleV2IND = $("#planBCTLRuleV2IND").val();
    const columnId = $("#columnId").val();

    if (planBCTLRuleV2IND && columnId) {
        const url = basicPath + '/fetchBctlvChildRule/' + cBBProductBaseID + '/' + planBCTLRuleV2IND + '/' + columnId;
        $.ajax({
            url: url,
            type: "GET",
            contentType: "application/json"
        })
            .then(
                function (childRules) {
                    if (childRules) {
                        if (childRules.length == 0) {
                            $("#delete-allChildRules-main").addClass(
                                'disabled');
                        } else {
                            $("#delete-allChildRules-main")
                                .removeClass('disabled');
                        }
                        $("#historyBtn").show();
                        prepareChildRulesTable(childRules);
                        loadQueryBuilders();
                        $("#childRules").val(childRules);
                        childRules
                            .forEach(function (childRuleObj) {
                                setTimeout(
                                    function () {
                                        if (childRuleObj.ruleLogicWhen && "null" != childRuleObj.ruleLogicWhen) {
                                            $('#whenQueryBuilder_' + childRuleObj.ruleId)
                                                .queryBuilder('setRules',
                                                    childRuleObj.ruleLogicWhen);
                                        }
                                        $('#thenQueryBuilder_' + childRuleObj.ruleId)
                                            .queryBuilder('setRules',
                                                childRuleObj.ruleLogicThen);
                                    }, 2000);
                            });
                    }
                }).fail(function (data) {
            console.log(data);
        });
    }
}

function getChildRules(ruleids) {
    if (ruleids) {
        const url = basicPath + '/getChildRules/' + ruleids;
        $.ajax({
            url: url,
            type: "GET",
            contentType: "application/json"
        })
            .then(
                function (childRules) {
                    if (childRules) {
                        if (childRules.length == 0) {
                            $("#delete-allChildRules-main").addClass(
                                'disabled');
                        } else {
                            $("#delete-allChildRules-main")
                                .removeClass('disabled');
                        }
                        $("#historyBtn").show();
                        prepareChildRulesTable(childRules);
                        loadQueryBuilders();
                        $("#childRules").val(childRules);
                        childRules
                            .forEach(function (childRuleObj) {
                                setTimeout(
                                    function () {
                                        if (childRuleObj.ruleLogicWhen && "null" != childRuleObj.ruleLogicWhen) {
                                            $('#whenQueryBuilder_' + childRuleObj.ruleId)
                                                .queryBuilder('setRules',
                                                    childRuleObj.ruleLogicWhen);
                                        }
                                        $('#thenQueryBuilder_' + childRuleObj.ruleId)
                                            .queryBuilder('setRules',
                                                childRuleObj.ruleLogicThen);
                                    }, 2000);
                            });
                    }
                }).fail(function (data) {
            console.log(data);
        });
    }
}

function displayChildRule(origRuleId, childRule) {
    let childContent = '';
    childContent += '<tbody class="reorderTbody">';
    childContent += '<tr data-toggle="collapse" id = "rule_' + childRule.ruleId
        + '"  data-target="#collapseOne_' + childRule.ruleId
        + '" aria-expanded="false" class="collapsed rules">';
    childContent += '<td id="' + childRule.ruleId + '" class="col-4">';
    childContent += '<input type="checkbox" name="copyChildRule" style="width: 50px"  onclick="enableCopyButton()" value=' + childRule.ruleId + '>';
    childContent += childRule.ruleId;
    childContent += '</td>';
    childContent += '<td class="col-4">';
    childContent += childRule.createdBy;
    childContent += '</td>';
    childContent += '<td class="col-3">';
    childContent += childRule.createdDate;
    childContent += '</td>';
    childContent += '<td class="col-1 arrow">';
    childContent += '<i class="fa fa-angle-down" style="margin-left:50px;"></i>';
    childContent += '</td>';
    childContent += '</tr>';

    childContent += '<tr id="row_' + childRule.ruleId + '">';
    childContent += '<td  colspan="3" id="plugin_' + childRule.ruleId
        + '" class="col-12">';
    childContent += '<div id="collapseOne_' + childRule.ruleId
        + '" class="collapse">';
    childContent += '<label for="whenQueryBuilder">When</label><div id="whenQueryBuilder_'
        + childRule.ruleId + '" class="whenQueryBuilder" ></div>';
    childContent += '<label for="thenQueryBuilder">Then</label><div id="thenQueryBuilder_'
        + childRule.ruleId
        + '" class="thenQueryBuilder"></div> <div class="form-row" style="padding-top: 1em"><div class="col-8"></div>';
    if ($("#isReadOnly").val() === false) {
        if (document.getElementById('roleId').value != 7) {
            childContent += '<div class="col-2"><button type="button" class="btn btn-outline-danger btn-block" id="child-rule-delete"  onclick="deleteChildRule('
                + childRule.ruleId + ');">Delete</button></div>';
            childContent += '<div class="col-2"><button type="button" class="btn btn-outline-success btn-block" id="child-rule-save" onclick="saveBctlvChildRule('
                + childRule.ruleId + ')">Update</button> </div>';
        }
    }
    childContent += '</div> </div>';
    childContent += '</td>';
    childContent += '</tr>';
    childContent += '</tbody>';

    if (origRuleId != '') {
        var origChildRow = document.getElementById('row_' + origRuleId);
        origChildRow.insertAdjacentHTML('afterend', childContent);
    } else {
        $("#childRules").append(childContent);
    }
}

function deleteChildRule(deleteRuleId) {
    $("#rule_" + deleteRuleId).remove();
    $("#plugin_" + deleteRuleId).parent().remove();
    $('#unsavedChanges').val('true');
}

function prepareChildRulesTable(childRules) {

    var historicalData = $("#historicalData").val();
    const childRulesHeader = getChildRulesTableHeader();

    let childContent = '';
    childRules
        .forEach(function (childRuleObj) {
            childContent += '<tbody class="reorderTbody">';
            childContent += '<tr data-toggle="collapse" id = "rule_'
                + childRuleObj.ruleId + '"  data-target="#collapseOne_'
                + childRuleObj.ruleId
                + '" aria-expanded="false" class="collapsed rules">';
            childContent += '<td id="' + childRuleObj.ruleId
                + '" class="col-4">';
            childContent += '<input type="checkbox" name="copyChildRule" style="width: 50px"  onclick="enableCopyButton()" value=' + childRuleObj.ruleId + '>';
            childContent += childRuleObj.ruleId;
            childContent += '</td>';
            childContent += '<td class="col-4">';
            childContent += childRuleObj.createdBy;
            childContent += '</td>';
            childContent += '<td class="col-3">';
            childContent += childRuleObj.createdDate;
            childContent += '</td>';
            childContent += '<td class="col-1 arrow">';
            childContent += '<i class="fa fa-angle-down" style="margin-left:50px;"></i>';
            childContent += '</td>';
            childContent += '</tr>';

            childContent += '<tr id="row_' + childRuleObj.ruleId + '">';
            childContent += '<td  colspan="3" id="plugin_'
                + childRuleObj.ruleId + '" class="col-12">';
            childContent += '<div id="collapseOne_' + childRuleObj.ruleId
                + '" class="collapse">';
            childContent += '<label for="whenQueryBuilder">When</label><div id="whenQueryBuilder_'
                + childRuleObj.ruleId
                + '" class="whenQueryBuilder" ></div>';
            childContent += '<label for="thenQueryBuilder">Then</label><div id="thenQueryBuilder_'
                + childRuleObj.ruleId
                + '" class="thenQueryBuilder"></div> <div class="form-row" style="padding-top: 1em"><div class="col-8"></div>';

            if (historicalData == "true" || $("#isReadOnly").val() === "true")
                childContent += '<div class="col-4"></div>';
            else {
                childContent += '<div class="col-2"><button type="button" class="btn btn-outline-danger btn-block" id="child-rule-delete"  onclick="deleteChildRule('
                    + childRuleObj.ruleId + ');">Delete</button></div>';
                childContent += '<div class="col-2"><button type="button" class="btn btn-outline-success btn-block" id="child-rule-save" onclick="saveBctlvChildRule('
                    + childRuleObj.ruleId + ')">Update</button> </div>';
            }

            childContent += '</div> </div>';
            childContent += '</td>';
            childContent += '</tr>';
            childContent += '</tbody>';
        });
    const childRulesTableContent = childRulesHeader + childContent;
    $('#childRules').html(childRulesTableContent);
}

const getChildRulesTableHeader = () => {
    let childHeader = '<thead>';
    childHeader += '<tr>';
    childHeader += '<th scope="col">Rule Id </th>';
    childHeader += '<th scope="col">Created By </th>';
    childHeader += '<th scope="col">Created Date </th>';
    childHeader += '<th scope="col"></th>';
    childHeader += '</tr>';
    childHeader += '</thead>';

    return childHeader;
}

function displayContextMenu(event, rowId, cBBProductBaseID) {
    event.preventDefault();
    // alert('Right-click context menu');
    var contextMenu = document.getElementById('contextMenu');
    var scrollX = window.scrollX || window.pageXOffset;
    var scrollY = window.scrollY || window.pageYOffset;
    contextMenu.style.left = (event.clientX + scrollX) + 'px';
    contextMenu.style.top = (event.clientY + scrollY) + 'px';
    contextMenu.style.display = 'block';
    document.addEventListener('click', hideContextMenu);
}

function hideContextMenu() {
    var contextMenu = document.getElementById('contextMenu');
    contextMenu.style.display = 'none';
    document.removeEventListener('click', hideContextMenu);
}

function hideContextMenuPoc() {
    $("#contextMenu").hide();
    document.removeEventListener('click', hideContextMenu);
}

let selectedRows = [];

function handleCheckboxClick(checkbox) {
    const row = checkbox.closest("tr");
    const dropdown = row.querySelectorAll("select");
    const ruleId = checkbox.getAttribute("data-id");
    const status = checkbox.getAttribute("data-status");

    if (checkbox.checked) {
        selectedRows.push({
            ruleId,
            status,
        });

        row.classList.add("row-selected");
        dropdown.forEach((select) => select.classList.add("row-selected"));
    } else {
        selectedRows = selectedRows.filter((row) => row.ruleId !== ruleId);
        row.classList.remove("row-selected");
        dropdown.forEach((select) => select.classList.remove("row-selected"));
    }
}

function copyChildRules() {
    clearCopiedLocalData();
    const rowData = [];
    $("input:checkbox[name=copyChildRule]:checked").each(function () {
        rowData.push($(this).val());
    });
    alert("Copied " + rowData.length + " rules successfully to clipboard");
    columnId = $("#columnId").val();
    //copied to session. it will be available to all cells
    sessionStorage.setItem("childRulesCopiedSessionData", rowData.toString());

    //copied to localStorage. This is for the pasteRecord function
    localStorage.setItem("childRulesCopiedLocalData", rowData.toString());
    localStorage.setItem("columnId", columnId);

    $('#pasteRuleId').prop('disabled', false);
    $("#isCopyEnabled").val("true");
    $('#multiRuleModal').css('display', 'none');
    $('.modal-backdrop').css('display', 'none');
}

function enableBackGround() {
    $('.modal-backdrop').css('display', 'none');
}

function pasteChildRules() {
    const rules = new Set();
    $("#childRules").find("tr.rules").each(function () {
        var rowId = this.id;
        if (rowId)
            rules.add(rowId.split("_")[1]);
    });
    const sessionRulesData = localStorage.getItem("childRulesCopiedLocalData");
    const copiedRules = sessionRulesData.split(',');
    for (let i = 0; i < copiedRules.length; i++) {
        rules.add(copiedRules[i]);
    }
    const rulesList = Array.from(rules);
    $('#pasteRuleId').prop('disabled', true);
    getChildRules(rulesList);
}

function pasteRecord() {
    const productBaseId = bctlvUrlParams.get("id");
    const isSelectAll = $('#selectAllCheckbox').is(':checked');
    if (selectedRows.length === 0) {
        alert('Please select at least 1 Bctlv Record');
    } else {
        var pasteData = {
            cbbid: productBaseId,
            columnId: localStorage.getItem("columnId"),
            ruleIds: selectedRows.map(row => row.ruleId),
            copiedRules: localStorage.getItem("childRulesCopiedLocalData").split(','),
            isSelectAll: isSelectAll
        };
        showAndHide();
        $.ajax({
            type: "POST",
            url: basicPath + "/pasteChildRules?productBaseId=" + productBaseId,
            data: JSON.stringify(pasteData),
            contentType: "application/json",
            success: function (response) {
                window.onbeforeunload = null;
                window.location.reload();
                alert("Successfully pasted child rule(s)");
            },
            error: function (error) {
                console.error(error);
                alert("Failed!");
            }
        });
    }
}

function enableCopyButton() {
    $("#isCopyEnabled").val("true");
    $('#copyRuleId').prop('disabled', false);
}

function clearSession() {
    window.onbeforeunload = null;
    clearCopiedLocalData();
    sessionStorage.clear();
    history.back();
}

function clearCopiedLocalData() {
    localStorage.removeItem("childRulesCopiedLocalData");
    localStorage.removeItem("columnId");
}

function cloneRecord() {
    if (selectedRows.length === 0) {
        alert('Please select at least 1 Bctlv Record');
    } else {
        isContextMenu = true;
        $("#cloneModal").modal("show");
    }
}

function deleteRecord() {
    const productBaseId = bctlvUrlParams.get("id");

    if (selectedRows.length === 0) {
        alert('Please select at least 1 Bctlv Record');
    } else {
        let dataToDelete = [];
        selectedRows.forEach(row => {
            dataToDelete.push({
                planBCTLVRuleV2ID: row.ruleId,
                status: row.status,
                cbbProductBaseId: productBaseId,
                checked: true,
            });
        });

        console.log("dataToDelete", dataToDelete);

        showAndHide();
        $.ajax({
            type: "DELETE",
            url: basicPath + "/deleteBCTLVRecord?productBaseId=" + productBaseId,
            data: JSON.stringify(dataToDelete),
            contentType: "application/json",
            success: function (response) {
                window.onbeforeunload = null;
                window.location.reload();
                alert("Records Deleted Successfully");
            },
            error: function (error) {
                alert("Records Deletion failed");
            }
        });

    }
}

function duplicateRecord() {
    const productBaseId = bctlvUrlParams.get("id");
    if (selectedRows.length === 0) {
        alert('Please select at least 1 Bctlv Record');
    } else {
        var duplicatingData = {
            ruleIds: selectedRows.map(row => row.ruleId),
            cbbid: productBaseId
        };
        showAndHide();
        $.ajax({
            type: "POST",
            url: basicPath + "/duplicateRecord?productBaseId=" + productBaseId,
            data: JSON.stringify(duplicatingData),
            contentType: "application/json",
            success: function (response) {
                window.onbeforeunload = null;
                window.location.reload();
                alert("Data Duplicated Successfully");
            },
            error: function (error) {
                alert("Data Duplication failed");
            }
        });
    }
}

function saveBctlvV2Rules() {
	// Clear the local storage
	clearCopiedLocalData();

	const productBaseId = bctlvUrlParams.get("id");

	// Container for the data to be saved
	let editedRows = [];

	// Iterate through the rows and check if the data has been edited
    bctlvDatatable.rows().every(function() {
		let data = this.data();
		let row = this.node();

		let rowData = {
			planBCTLVRuleV2ID: data.planBCTLVRuleV2ID,
			benefitCategory: $(row).find('#dt-bencat-select-'+data.planBCTLVRuleV2ID).val(),
			paymentLine: $(row).find('#dt-paymentline-select-'+data.planBCTLVRuleV2ID).val(),
			tier: $(row).find('#dt-tier-select-'+data.planBCTLVRuleV2ID).val(),
			costShareOverrides: $(row).find('#dt-cso-select-'+data.planBCTLVRuleV2ID).val(),
			category: $(row).find('.dt-category').text(),
			benefitCode: $(row).find('.dt-benefit-code').text(),
			referencePlaceOfService: $(row).find('.dt-rpos').text(),
			effectiveDate: $(row).find('.effDateInput').val(),
			expirationDate: $(row).find('.expDateInput').val(),
			cbbProductBaseId: productBaseId,
			checked: "true",
			status: "1"
		};

		// Compare with cached data if the row has been edited
		if (isRowDataEdited(bctlvAjaxData.bctlvData, rowData)) {
			editedRows.push(rowData);
		}
	})

	if (editedRows.length === 0) {
		alert('No changes detected');
	} else {
		showAndHide();

		$.ajax({
			type: 'POST',
			url : basicPath + "/saveBctlvDropDowns?productBaseId=" + productBaseId,
			data: JSON.stringify(editedRows),
			contentType : "application/json",
			success: function(){
				showAndHide();
				window.location.reload();
				alert('Data saved successfully');
			},
			error: function (){
				alert('Error occurred while saving data');
			}
		});
	}
}

function exportPlanBCTLVRuleV2() {
    clearCopiedLocalData();
    window.onbeforeunload = null;
    let productBaseId = document.getElementById("productBaseId").value;
    window.location.href = "/cbb-ui/planBCTLVRuleV2-xlsx?id=" + encodeURIComponent(productBaseId);
}

function addRecord() {
    const id = bctlvUrlParams.get("id");
    const apiUrl = `/cbb-ui/addBCTLVRecord/${id}`;
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'ContentType': 'application/json',
        },
    })
        .then(response => {
            if (response.ok) {
                window.onbeforeunload = null;
                window.location.reload();
            } else {
                console.error('Failed to add new Bctlv2 Record');
            }
        })
        .catch(error => {
            console.error('API error', error);
        });
}

function collapseShow() {
    $(".collapse").addClass('show');
}

function collapseHide() {
    $(".collapse").removeClass('show');
}

function loadPlanBCTLVRuleV2History() {
    const planBCTLRuleV2IND = $("#planBCTLRuleV2IND").val();
    const columnId = $("#columnId").val();
    const cBBProductBaseID = $("#cBBProductBaseID").val();

    if (planBCTLRuleV2IND && columnId) {
        const url = basicPath + '/planBCTLVRuleV2/history/' + cBBProductBaseID + '/' + planBCTLRuleV2IND + '/' + columnId;
        $.ajax({
            url: url,
            type: "GET",
            contentType: "application/json"
        }).then(function (ruleLogicHistoryDetails) {
            preparePlanBCTLVRuleV2HistoryTable(ruleLogicHistoryDetails);
        }).fail(function (data) {
            console.log(data);
        });
    }
}

function preparePlanBCTLVRuleV2HistoryTable(ruleLogicHistoryDetails) {
    const planBCTLRuleV2IND = $("#planBCTLRuleV2IND").val();
    const columnId = $("#columnId").val();
    let ruleLogicHistoryContent = '';
    ruleLogicHistoryDetails
        .forEach(function (ruleLogicHistoryObj) {
            ruleLogicHistoryContent += '<tr data-toggle="collapse">';
            ruleLogicHistoryContent += '<td class="col-4">';
            ruleLogicHistoryContent += ' <a type="submit" href="javascript:flipModal(' + '[' + ruleLogicHistoryObj.groupRuleID + ']' + ')'
                + '" style ="border-top-left-radius:0px; border-bottom-left-radius:0px;border-top-right-radius:3px;border-top-bottom-radius:3px;">'
                + ruleLogicHistoryObj.groupRuleID + '</a>';
            ruleLogicHistoryContent += '</td>';
            ruleLogicHistoryContent += '<td class="col-4">';
            ruleLogicHistoryContent += ruleLogicHistoryObj.createdBy;
            ruleLogicHistoryContent += '</td>';
            ruleLogicHistoryContent += '<td class="col-4">';
            ruleLogicHistoryContent += ruleLogicHistoryObj.createdDate;
            ruleLogicHistoryContent += '</td>';
            ruleLogicHistoryContent += '</tr>';
        });

    $('#planBCTLVRuleV2HistoryBody').html(ruleLogicHistoryContent);
}

function buildOldBctlvTable() {
	var table
	var state
	const isBenefitCodeToggle = $("#benefitCodeToggle").val() === "true";
	table = $('#mainBctlvTable').DataTable( {
		scrollCollapse: true,
		scrollY: '60vh',
		scrollX: true,
		paging: false,
		"aoColumnDefs": [{
			"bSortable": false,
			"aTargets": isBenefitCodeToggle ? [8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]:[7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]
		}],
		order: [[isBenefitCodeToggle ? 7 : 6, 'asc']],
		fixedColumns: {
			left: isBenefitCodeToggle ? 7 : 6
		},
		stateSave: true
	});
	//Restore state
	state = table.state.loaded();
	if ( state ) {
		table.columns().eq( 0 ).each( function ( colIdx ) {
			var colSearch = state.columns[colIdx].search;
			if ( colSearch.search ) {
				$( 'input', table.column( colIdx ).footer() ).val( colSearch.search );
			}
		} );
		if (String(window.performance.getEntriesByType("navigation")[0].type) === "navigate" ||
			String(window.performance.getEntriesByType("navigation")[0].type) === "back_forward") {
			table.search('').draw();
		} else {
			table.draw();
		}
	}
}

function removeErrorCodes() {
	const navigationEntries = performance.getEntriesByType('navigation');
	const isAgreeButtonClicked = sessionStorage.getItem('isAgreeButtonClicked') ? sessionStorage.getItem('isAgreeButtonClicked') : 'false';
	if (navigationEntries.length > 0 && (navigationEntries[0].type === 'reload' || navigationEntries[0].type === 'back_forward' || navigationEntries[0].type === 'navigate') && isAgreeButtonClicked === 'false') {
		const productBaseID = $("#productBaseId").val();
		$.ajax({
			url: basicPath + "/benefitCodeError",
			type: 'DELETE',
			data: {
				productBaseID: productBaseID
			},
			success: function(response) {
				console.log('Success:', response);
			},
			error: function(error) {
				console.error('Error:', error);
			}
		});
	}
}

const releaseLock = (e, isSessionExpired) => {
    const target = $(e.currentTarget);
    let checkOutById = $('#checkOutById').val() | target.data('checkoutbyid');
    let checkOutByName = $('#checkOutByName').val() ? $('#checkOutByName').val() : target.data('checkoutbyname');
    if ($("#isReadOnly").val() !== "true") {
        if (checkOutById) {
            let confirmation;
            if (isSessionExpired) {
                confirmation = true;
            } else {
                confirmation = confirm("Are you done editing this template?");
            }
            if (confirmation) {
                clearCopiedLocalData();
                let result = true;
                let productBaseId = $('#productBaseId').val() | target.data('productBaseId');
                let productBaseCheckOutRequest = JSON.stringify({
                    productBaseId: productBaseId,
                    userId: checkOutById,
                    username: checkOutByName
                });
                $.ajax({
                    url: basicPath + "/removeCheckOut",
                    type: "post",
                    datyaType: "json",
                    data: productBaseCheckOutRequest,
                    contentType: "application/json",
                    async: false
                })
                    .fail(function (data) {
                        e.preventDefault();
                        result = false;
                    });
                if (result) {
                    unbindBeforeUnload(e, productBaseId);
                }
                return result;
            } else {
                e.preventDefault();
                return false;
            }
        }
    }
    return true;
}

const unbindBeforeUnload = (e, productBaseId) => {
    const url = window.location.href;
    if (url.includes('planBCTLVRuleV2')) {
        window.onbeforeunload = null;
    }
    if (url.includes('ruleManagement')) {
        document.getElementById("editRuleManagement" + productBaseId).setAttribute('onclick', 'checkLock(event, null, \'\')');
        $('#btnReleaseLock' + productBaseId).css('display', 'none');
        //window.location.reload();
    }
    return true;
}

function clearRuleManagementFields() {
    $('#organization').val("");
    $('#state').val("");
    $('#cloneToPlanType').val("");
    $('#cocSeries').val("");
    $('#segment').val("");
    $('#product').val("");
    $('#standard').val("");
    rulesSearch();
}

function closeModal() {
    $("#displayPopup").modal('hide');
}

function closeCloneModal() {
    $("#cloneModal").modal('hide');
}

function enforceMaxLength(event, maxLength) {
    var element = event.target;
    var text = element.textContent.trim();

    // If the length exceeds the maximum, truncate it
    if (text.length > maxLength) {
        element.textContent = text.substring(0, maxLength);

        // Set the cursor position to the end of the text
        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false); // collapse the range to the end
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
function isRowDataEdited(sourceData, rowData) {
	let currentData = sourceData.find(data => data.planBCTLVRuleV2ID === rowData.planBCTLVRuleV2ID);

	// Transform null dates to blank
	let effDate = currentData.effectiveDate === null ? "" : currentData.effectiveDate;
	let expDate = currentData.expirationDate === null ? "" : currentData.expirationDate;

	if (String(currentData.benefitCategory) !== String(rowData.benefitCategory)) {
		return true;
	} else if (String(currentData.paymentLine) !== String(rowData.paymentLine)) {
		return true;
	} else if (String(currentData.tier) !== String(rowData.tier)) {
		return true;
	} else if (String(currentData.costShareOverrides) !== String(rowData.costShareOverrides)) {
		return true;
	} else if (String(currentData.category) !== String(rowData.category)) {
		return true;
	} else if (String(currentData.benefitCode) !== String(rowData.benefitCode)) {
		return true;
	} else if (String(currentData.referencePlaceOfService) !== String(rowData.referencePlaceOfService)) {
		return true;
	} else if (String(effDate) !== String(rowData.effectiveDate)) {
		return true;
	} else if (String(expDate) !== String(rowData.expirationDate)) {
		return true;
	} else {
		return false;
	}
}

