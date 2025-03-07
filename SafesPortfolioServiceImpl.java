package com.optum.shop.service.impl;

import com.mongodb.MongoBulkWriteException;
import com.mongodb.bulk.BulkWriteError;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.InsertOneModel;
import com.mongodb.client.model.WriteModel;
import com.optum.shop.enums.PortfolioType;
import com.optum.shop.mongodb.model.SafesPortfolio;
import com.optum.shop.mongodb.repo.SafesPortfolioRepository;
import com.optum.shop.pgt.model.DataWarehousePlan;
import com.optum.shop.pgt.model.DataWarehouseRx;
import com.optum.shop.pgt.repo.NativeRepository;
import com.optum.shop.service.CacheService;
import com.optum.shop.service.SafesPortfolioService;
import com.optum.shop.util.DataWarehouseUtil;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SafesPortfolioServiceImpl implements SafesPortfolioService {

    private static final Logger logger = LoggerFactory.getLogger(SafesPortfolioServiceImpl.class);

    @Autowired
    private final MongoTemplate mongoTemplate;

    @Override
    public Integer insertSafesMedPlans(List<DataWarehousePlan> dataWarehousePlanList, String collectionName) {
        logger.info("Inserting safes masterMed plans to Mongo...", dataWarehousePlanList.size());

        List<WriteModel<Document>> operations = new ArrayList<>();
        MongoCollection<Document> collection = mongoTemplate.getCollection(collectionName);
        int invalidDocuments = 0;

        try {
            for (DataWarehousePlan plan : dataWarehousePlanList) {
                SafesPortfolio safesMedicalPlan = buildSafesMedicalPlan(plan);
                operations.add(new InsertOneModel<>(DataWarehouseUtil.docToBsonDocument(safesMedicalPlan)));
            }

            int chunkSize = 1000;
            DataWarehouseUtil.batchInsert(operations, collection, chunkSize);
        } catch (MongoBulkWriteException e) {
            for (BulkWriteError error : e.getWriteErrors()) {

                DataWarehouseUtil.handleSchemaValidationErrorLogs(error);
                invalidDocuments++;
            }
            logger.warn("SAFES Med: Total invalid documents that were not inserted: {}", invalidDocuments);
        } catch (Exception e) {
            logger.error("SAFES Med: Error inserting safes masterMed plans to Mongo", e);
            throw e;
        }
        return operations.size() - invalidDocuments;
    }

    @Override
    public Integer insertSafesRxPlans(List<DataWarehouseRx> dataWarehouseRxList, String collectionName) {
        logger.info("inserting safes rx plans to Mongo...", dataWarehouseRxList.size());

        List<WriteModel<Document>> operations = new ArrayList<>();
        MongoCollection<Document> collection = mongoTemplate.getCollection(collectionName);
        int invalidDocuments = 0;

        try {
            for (DataWarehouseRx plan : dataWarehouseRxList) {
                SafesPortfolio rxPlan = buildSafesRxPlan(plan);
                operations.add(new InsertOneModel<>(DataWarehouseUtil.docToBsonDocument(rxPlan)));
            }

            int chunkSize = 100;
            DataWarehouseUtil.batchInsert(operations, collection, chunkSize);
        } catch (MongoBulkWriteException e) {
            for (BulkWriteError error : e.getWriteErrors()) {

                DataWarehouseUtil.handleSchemaValidationErrorLogs(error);
                invalidDocuments++;
            }
            logger.warn("SAFES Rx: Total invalid documents that were not inserted: {}", invalidDocuments);
        } catch (Exception e) {
            logger.error("SAFES Rx: Error inserting safes rx plans to Mongo", e);
            throw e;
        }
        return operations.size() - invalidDocuments;
    }

    @Override
    public void deleteSafesPortfolioPlans(String collection) {
        logger.info("Deleting safes portfolio plans in Mongo...");
        try {
            mongoTemplate.remove(new Query(), collection);
        } catch (Exception e) {
            logger.error("Error deleting safes portfolio plans in Mongo.", e);
            throw e;
        }
    }

    private SafesPortfolio buildSafesMedicalPlan(DataWarehousePlan plan) {
        SafesPortfolio safesMedicalPlan = new SafesPortfolio();
        try {
            safesMedicalPlan.setPlanType("Medical");
            safesMedicalPlan.setGridName(StringUtils.defaultString(plan.getGridName(), ""));
            safesMedicalPlan.setTabName(StringUtils.defaultString(plan.getTabName(), ""));
            safesMedicalPlan.setStateAbbr(StringUtils.defaultString(plan.getStateAbbr(), ""));
            safesMedicalPlan.setCocSeries(StringUtils.defaultString(DataWarehouseUtil.extractCocSeries(plan.getGridName()), ""));
            safesMedicalPlan.setOrganization(StringUtils.defaultString(DataWarehouseUtil.extractOrganization(plan.getGridName(), plan.getTabName(), plan.getPlatform(), PortfolioType.SAFES_PORTFOLIO, plan.getLegalEntity()), ""));

            safesMedicalPlan.setPlanCode(StringUtils.defaultString(plan.getPlanCode(), ""));
            safesMedicalPlan.setCurrentNICEPlanCode(StringUtils.defaultString(plan.getCurrentNICEPlanCode(), ""));
            safesMedicalPlan.setCurrentNICEPlanCodeAB1401(StringUtils.defaultString(plan.getCurrentNICEPlanCodeAB1401(), ""));
            safesMedicalPlan.setCurrentNICEPlanCodeCalCobra(StringUtils.defaultString(plan.getCurrentNICEPlanCodeCalCobra(), ""));
            safesMedicalPlan.setCurrentNICEPlanCodeCobra(StringUtils.defaultString(plan.getCurrentNICEPlanCodeCobra(), ""));
            safesMedicalPlan.setPriorPlanCode(StringUtils.defaultString(plan.getPriorPlanCode(), ""));
            safesMedicalPlan.setPriorPlanCodeNICE(StringUtils.defaultString(plan.getPriorPlanCodeNICE(), ""));
            safesMedicalPlan.setPriorPlanCodeNICEAB1401(StringUtils.defaultString(plan.getPriorPlanCodeNICEAB1401(), ""));
            safesMedicalPlan.setPriorPlanCodeNICECobra(StringUtils.defaultString(plan.getPriorPlanCodeNICECobra(), ""));
            safesMedicalPlan.setPriorNICEPlanCodeCalCobra(StringUtils.defaultString(plan.getPriorNICEPlanCodeCalCobra(), ""));

            safesMedicalPlan.setAccumCrossApplyInd(StringUtils.defaultString(plan.getAccumCrossApplyInd(), ""));
            safesMedicalPlan.setAccumCrossInnToOon(StringUtils.defaultString(plan.getAccumCrossInnToOon(), ""));
            safesMedicalPlan.setAccumCrossOonToInn(StringUtils.defaultString(plan.getAccumCrossOonToInn(), ""));
            safesMedicalPlan.setActuarialValueMax(StringUtils.defaultString(plan.getActuarialValueMax(), ""));
            safesMedicalPlan.setActuarialValueMin(StringUtils.defaultString(plan.getActuarialValueMin(), ""));
            safesMedicalPlan.setAcupunctureCode(StringUtils.defaultString(plan.getAcupunctureCode(), ""));
            safesMedicalPlan.setAdultDentalApplyToMedicalOopm(StringUtils.defaultString(plan.getAdultDentalApplyToMedicalOopm(), ""));
            safesMedicalPlan.setAdultDentalDedAppliesTo(StringUtils.defaultString(plan.getAdultDentalDedAppliesTo(), ""));
            safesMedicalPlan.setAdultDentalDedIncInMed(StringUtils.defaultString(plan.getAdultDentalDedIncInMed(), ""));
            safesMedicalPlan.setAdultDentalDedStrategy(StringUtils.defaultString(plan.getAdultDentalDedStrategy(), ""));
            safesMedicalPlan.setAdultDentalMaximumBenefit(StringUtils.defaultString(plan.getAdultDentalMaximumBenefit(), ""));
            safesMedicalPlan.setAdultDentalProdType(StringUtils.defaultString(plan.getAdultDentalProdType(), ""));
            safesMedicalPlan.setAdultVisionApplyToMedicalOopm(StringUtils.defaultString(plan.getAdultVisionApplyToMedicalOopm(), ""));
            safesMedicalPlan.setAdultVisionDedAppliesTo(StringUtils.defaultString(plan.getAdultVisionDedAppliesTo(), ""));
            safesMedicalPlan.setAdultVisionDedIncInMed(StringUtils.defaultString(plan.getAdultVisionDedIncInMed(), ""));
            safesMedicalPlan.setAggregateGroupIndicator(StringUtils.defaultString(plan.getAggregateGroupIndicator(), ""));
            safesMedicalPlan.setAhpEligible(StringUtils.defaultString(plan.getAhpEligible(), ""));
            safesMedicalPlan.setAhpRxCodes(StringUtils.defaultString(plan.getAhpRxCodes(), ""));
            safesMedicalPlan.setAlternateDescription(StringUtils.defaultString(plan.getAlternateDescription(), ""));
            safesMedicalPlan.setArchetype(StringUtils.defaultString(plan.getArchetype(), ""));
            safesMedicalPlan.setAvailableRiders(StringUtils.defaultString(plan.getAvailableRiders(), ""));
            safesMedicalPlan.setAvailableRxCodesPrime(StringUtils.defaultString(plan.getAvailableRxCodesPrime(), ""));
            safesMedicalPlan.setAvRxPairingEndDate(StringUtils.defaultString(plan.getAvRxPairingEndDate(), ""));
            safesMedicalPlan.setAvRxPairingStartDate(StringUtils.defaultString(plan.getAvRxPairingStartDate(), ""));
            safesMedicalPlan.setBasePlan(StringUtils.defaultString(plan.getBasePlan(), ""));
            safesMedicalPlan.setBehavioralHealthCode(StringUtils.defaultString(plan.getBehavioralHealthCode(), ""));
            safesMedicalPlan.setBrandingEntity(StringUtils.defaultString(plan.getBrandingEntity(), ""));
            safesMedicalPlan.setCareCash(StringUtils.defaultString(plan.getCareCash(), ""));
            safesMedicalPlan.setCareCashEffectiveDate(StringUtils.defaultString(plan.getCareCashEffectiveDate(), ""));
            safesMedicalPlan.setCaseInstallFromDate(StringUtils.defaultString(plan.getCaseInstallFromDate(), ""));
            safesMedicalPlan.setCaseInstallThruDate(StringUtils.defaultString(plan.getCaseInstallThruDate(), ""));
            safesMedicalPlan.setCEDate(StringUtils.defaultString(plan.getCEDate(), ""));
            safesMedicalPlan.setChildOnlyOffering(StringUtils.defaultString(plan.getChildOnlyOffering(), ""));
            safesMedicalPlan.setChildOnlyPlanHiosId(StringUtils.defaultString(plan.getChildOnlyPlanHiosId(), ""));
            safesMedicalPlan.setChiropracticCode(StringUtils.defaultString(plan.getChiropracticCode(), ""));
            safesMedicalPlan.setCirrusBenefitPlanId(StringUtils.defaultString(plan.getCirrusBenefitPlanId(), ""));
            safesMedicalPlan.setCirrusProductId(StringUtils.defaultString(plan.getCirrusProductId(), ""));
            safesMedicalPlan.setCirrusTrackingNumbers(StringUtils.defaultString(plan.getCirrusTrackingNumbers(), ""));
            safesMedicalPlan.setCoeRulesApply(StringUtils.defaultString(plan.getCoeRulesApply(), ""));
            safesMedicalPlan.setCoinsNonNet(StringUtils.defaultString(plan.getCoinsNonNet(), ""));
            safesMedicalPlan.setCoinsNet(StringUtils.defaultString(plan.getCoinsNet(), ""));
            safesMedicalPlan.setCombinedRxPlanCode(StringUtils.defaultString(plan.getCombinedRxPlanCode(), ""));
            safesMedicalPlan.setCombTherapyLimits(StringUtils.defaultString(plan.getCombTherapyLimits(), ""));
            safesMedicalPlan.setCombTherapyLimitsDetail(StringUtils.defaultString(plan.getCombTherapyLimitsDetail(), ""));
            safesMedicalPlan.setCsrAmericanIndianPlan(StringUtils.defaultString(plan.getCsrAmericanIndianPlan(), ""));
            safesMedicalPlan.setDedPeriod(StringUtils.defaultString(plan.getDedPeriod(), ""));
            safesMedicalPlan.setDefaultRx(StringUtils.defaultString(plan.getDefaultRx(), ""));
            safesMedicalPlan.setDescription(StringUtils.defaultString(plan.getDescription(), ""));
            safesMedicalPlan.setDiscontinuedDate(StringUtils.defaultString(plan.getDiscontinuedDate(), ""));
            safesMedicalPlan.setEhbPercentOfTotalPrem(StringUtils.defaultString(plan.getEhbPercentOfTotalPrem(), ""));
            safesMedicalPlan.setEmergencyServicesUS(StringUtils.defaultString(plan.getEmergencyServicesUS(), ""));
            safesMedicalPlan.setExchangePlan(StringUtils.defaultString(plan.getExchangePlan(), ""));
            safesMedicalPlan.setFileId(StringUtils.defaultString(plan.getFileId(), ""));
            safesMedicalPlan.setGatekeeper(StringUtils.defaultString(plan.getGatekeeper(), ""));
            safesMedicalPlan.setGlobalOfficeCopay(StringUtils.defaultString(plan.getGlobalOfficeCopay(), ""));
            safesMedicalPlan.setGroupId(StringUtils.defaultString(plan.getGroupId(), ""));
            safesMedicalPlan.setGroupStructureProductId(StringUtils.defaultString(plan.getGroupStructureProductId(), ""));
            safesMedicalPlan.setHiosDescriptor(StringUtils.defaultString(plan.getHiosDescriptor(), ""));
            safesMedicalPlan.setHiosPlanID(StringUtils.defaultString(plan.getHiosPlanID(), ""));
            safesMedicalPlan.setHiosPlanID_A(StringUtils.defaultString(plan.getHiosPlanID_A(), ""));
            safesMedicalPlan.setHiosPlanID_B(StringUtils.defaultString(plan.getHiosPlanID_B(), ""));
            safesMedicalPlan.setHiosPlanID_C(StringUtils.defaultString(plan.getHiosPlanID_C(), ""));
            safesMedicalPlan.setHiosPlanID_D(StringUtils.defaultString(plan.getHiosPlanID_D(), ""));
            safesMedicalPlan.setHiosPlanID_E(StringUtils.defaultString(plan.getHiosPlanID_E(), ""));
            safesMedicalPlan.setHiosPlanID_F(StringUtils.defaultString(plan.getHiosPlanID_F(), ""));
            safesMedicalPlan.setHiosPlanID_G(StringUtils.defaultString(plan.getHiosPlanID_G(), ""));
            safesMedicalPlan.setHiosPlanIdforQHP(StringUtils.defaultString(plan.getHiosPlanIdforQHP(), ""));
            safesMedicalPlan.setHiosReason(StringUtils.defaultString(plan.getHiosReason(), ""));
            safesMedicalPlan.setHsaPreventiveList(StringUtils.defaultString(plan.getHsaPreventiveList(), ""));
            safesMedicalPlan.setHsaEligible(StringUtils.defaultString(plan.getHsaEligible(), ""));
            safesMedicalPlan.setHraEligible(StringUtils.defaultString(plan.getHraEligible(), ""));
            safesMedicalPlan.setHraHsaMin(StringUtils.defaultString(plan.getHraHsaMin(), ""));
            safesMedicalPlan.setHraHsaMax(StringUtils.defaultString(plan.getHraHsaMax(), ""));
            safesMedicalPlan.setIdentifier(StringUtils.defaultString(plan.getIdentifier(), ""));
            safesMedicalPlan.setIdeaDisplay(StringUtils.defaultString(plan.getIdeaDisplay(), ""));
            safesMedicalPlan.setIncludeOutOfArea(StringUtils.defaultString(plan.getIncludeOutOfArea(), ""));
            safesMedicalPlan.setInfertilityCode(StringUtils.defaultString(plan.getInfertilityCode(), ""));
            safesMedicalPlan.setInnAdultDentalFamDed(StringUtils.defaultString(plan.getInnAdultDentalFamDed(), ""));
            safesMedicalPlan.setInnAdultDentalSingDed(StringUtils.defaultString(plan.getInnAdultDentalSingDed(), ""));
            safesMedicalPlan.setInnFamilyDeductible(StringUtils.defaultString(plan.getInnFamilyDeductible(), ""));
            safesMedicalPlan.setInnFamilyDeductibleDesigNetwork(StringUtils.defaultString(plan.getInnFamilyDeductibleDesigNetwork(), ""));
            safesMedicalPlan.setInnFamilyDeductibleNetwork(StringUtils.defaultString(plan.getInnFamilyDeductibleNetwork(), ""));
            safesMedicalPlan.setInnFamilyDeductibleTier1(StringUtils.defaultString(plan.getInnFamilyDeductibleTier1(), ""));
            safesMedicalPlan.setInnFamilyDeductibleTier2(StringUtils.defaultString(plan.getInnFamilyDeductibleTier2(), ""));
            safesMedicalPlan.setInnFamilyOopm(StringUtils.defaultString(plan.getInnFamilyOopm(), ""));
            safesMedicalPlan.setInnFamilyOopmDesigNetwork(StringUtils.defaultString(plan.getInnFamilyOopmDesigNetwork(), ""));
            safesMedicalPlan.setInnFamilyOopmNetwork(StringUtils.defaultString(plan.getInnFamilyOopmNetwork(), ""));
            safesMedicalPlan.setInnFamilyOopmTier1(StringUtils.defaultString(plan.getInnFamilyOopmTier1(), ""));
            safesMedicalPlan.setInnFamilyOopmTier2(StringUtils.defaultString(plan.getInnFamilyOopmTier2(), ""));
            safesMedicalPlan.setInnFamilyUberOopm(StringUtils.defaultString(plan.getInnFamilyUberOopm(), ""));
            safesMedicalPlan.setInnFamilyUberOopmDedAppliesTo(StringUtils.defaultString(plan.getInnFamilyUberOopmDedAppliesTo(), ""));
            safesMedicalPlan.setInnIndividualDeductible(StringUtils.defaultString(plan.getInnIndividualDeductible(), ""));
            safesMedicalPlan.setInnIndividualDeductibleDesigNetwork(StringUtils.defaultString(plan.getInnIndividualDeductibleDesigNetwork(), ""));
            safesMedicalPlan.setInnIndividualDeductibleNetwork(StringUtils.defaultString(plan.getInnIndividualDeductibleNetwork(), ""));
            safesMedicalPlan.setInnIndividualDeductibleTier1(StringUtils.defaultString(plan.getInnIndividualDeductibleTier1(), ""));
            safesMedicalPlan.setInnIndividualDeductibleTier2(StringUtils.defaultString(plan.getInnIndividualDeductibleTier2(), ""));
            safesMedicalPlan.setInnIndividualOopm(StringUtils.defaultString(plan.getInnIndividualOopm(), ""));
            safesMedicalPlan.setInnIndividualOopmDesigNetwork(StringUtils.defaultString(plan.getInnIndividualOopmDesigNetwork(), ""));
            safesMedicalPlan.setInnIndividualOopmInFamOOPM(StringUtils.defaultString(plan.getInnIndividualOopmInFamOOPM(), ""));
            safesMedicalPlan.setInnIndividualOopmNetwork(StringUtils.defaultString(plan.getInnIndividualOopmNetwork(), ""));
            safesMedicalPlan.setInnIndividualOopmTier1(StringUtils.defaultString(plan.getInnIndividualOopmTier1(), ""));
            safesMedicalPlan.setInnIndividualOopmTier2(StringUtils.defaultString(plan.getInnIndividualOopmTier2(), ""));
            safesMedicalPlan.setInnIndividualUberOopm(StringUtils.defaultString(plan.getInnIndividualUberOopm(), ""));
            safesMedicalPlan.setInnIndividualUberOopmDedAppliesTo(StringUtils.defaultString(plan.getInnIndividualUberOopmDedAppliesTo(), ""));
            safesMedicalPlan.setInnPedDentalFamDed(StringUtils.defaultString(plan.getInnPedDentalFamDed(), ""));
            safesMedicalPlan.setInnPedDentalSingDed(StringUtils.defaultString(plan.getInnPedDentalSingDed(), ""));
            safesMedicalPlan.setIntlCoins(StringUtils.defaultString(plan.getIntlCoins(), ""));
            safesMedicalPlan.setIntlIndividualDeductible(StringUtils.defaultString(plan.getIntlIndividualDeductible(), ""));
            safesMedicalPlan.setIntlFamilyDeductible(StringUtils.defaultString(plan.getIntlFamilyDeductible(), ""));
            safesMedicalPlan.setIntlIndividualOOPM(StringUtils.defaultString(plan.getIntlIndividualOOPM(), ""));
            safesMedicalPlan.setIntlFamilyOOPM(StringUtils.defaultString(plan.getIntlFamilyOOPM(), ""));
            safesMedicalPlan.setIsBenefitAvailable(StringUtils.defaultString(plan.getIsBenefitAvailable(), ""));
            safesMedicalPlan.setLegalEntity(StringUtils.defaultString(plan.getLegalEntity(), ""));
            safesMedicalPlan.setLegalEntity2(StringUtils.defaultString(plan.getLegalEntity2(), ""));
            safesMedicalPlan.setLegalEntity3(StringUtils.defaultString(plan.getLegalEntity3(), ""));
            safesMedicalPlan.setLegalEntity4(StringUtils.defaultString(plan.getLegalEntity4(), ""));
            safesMedicalPlan.setLegalEntity5(StringUtils.defaultString(plan.getLegalEntity5(), ""));
            safesMedicalPlan.setLegalEntity6(StringUtils.defaultString(plan.getLegalEntity6(), ""));
            safesMedicalPlan.setLegalEntity7(StringUtils.defaultString(plan.getLegalEntity7(), ""));
            safesMedicalPlan.setLegalEntity8(StringUtils.defaultString(plan.getLegalEntity8(), ""));
            safesMedicalPlan.setLicense(StringUtils.defaultString(plan.getLicense(), ""));
            safesMedicalPlan.setMarketingGrid(StringUtils.defaultString(plan.getMarketingGrid(), ""));
            safesMedicalPlan.setMarketCode(StringUtils.defaultString(plan.getMarketCode(), ""));
            safesMedicalPlan.setMarketCodes(StringUtils.defaultString(plan.getMarketCodes(), ""));
            safesMedicalPlan.setMarketingName(StringUtils.defaultString(plan.getMarketingName(), ""));
            safesMedicalPlan.setMedDedType(StringUtils.defaultString(plan.getMedDedType(), ""));
            safesMedicalPlan.setMedicalAnnualMaximum(StringUtils.defaultString(plan.getMedicalAnnualMaximum(), ""));
            safesMedicalPlan.setMedicalMaximumperTrip(StringUtils.defaultString(plan.getMedicalMaximumperTrip(), ""));
            safesMedicalPlan.setMedOopmType(StringUtils.defaultString(plan.getMedOopmType(), ""));
            safesMedicalPlan.setMedRxDedType(StringUtils.defaultString(plan.getMedRxDedType(), ""));
            safesMedicalPlan.setMedRxOOPMType(StringUtils.defaultString(plan.getMedRxOOPMType(), ""));
            safesMedicalPlan.setMetallicLevel(StringUtils.defaultString(plan.getMetallicLevel(), ""));
            safesMedicalPlan.setMotionIndicator(StringUtils.defaultString(plan.getMotionIndicator(), ""));
            safesMedicalPlan.setMotionIndicatorEffectiveDate(StringUtils.defaultString(plan.getMotionIndicatorEffectiveDate(), ""));
            safesMedicalPlan.setMskLowBack(StringUtils.defaultString(plan.getMskLowBack(), ""));
            safesMedicalPlan.setNetwork(StringUtils.defaultString(plan.getNetwork(), ""));
            safesMedicalPlan.setNetworkScheduleId(StringUtils.defaultString(plan.getNetworkScheduleId(), ""));
            safesMedicalPlan.setNewBusinessOrRenewal(StringUtils.defaultString(plan.getNewBusinessOrRenewal(), ""));
            safesMedicalPlan.setNewBusinessQuotingFromDate(StringUtils.defaultString(plan.getNewBusinessQuotingFromDate(), ""));
            safesMedicalPlan.setNewBusinessQuotingThruDate(StringUtils.defaultString(plan.getNewBusinessQuotingThruDate(), ""));
            safesMedicalPlan.setOonFamilyDeductible(StringUtils.defaultString(plan.getOonFamilyDeductible(), ""));
            safesMedicalPlan.setOonFamilyOopm(StringUtils.defaultString(plan.getOonFamilyOopm(), ""));
            safesMedicalPlan.setOonIndividualDeductible(StringUtils.defaultString(plan.getOonIndividualDeductible(), ""));
            safesMedicalPlan.setOonIndividualOopm(StringUtils.defaultString(plan.getOonIndividualOopm(), ""));
            safesMedicalPlan.setOonReimbursementType(StringUtils.defaultString(plan.getOonReimbursementType(), ""));
            safesMedicalPlan.setOnnAdultDentalFamDed(StringUtils.defaultString(plan.getOnnAdultDentalFamDed(), ""));
            safesMedicalPlan.setOnnAdultDentalSingDed(StringUtils.defaultString(plan.getOnnAdultDentalSingDed(), ""));
            safesMedicalPlan.setOnnPedDentalFamDed(StringUtils.defaultString(plan.getOnnPedDentalFamDed(), ""));
            safesMedicalPlan.setOnnPedDentalSingDed(StringUtils.defaultString(plan.getOnnPedDentalSingDed(), ""));
            safesMedicalPlan.setOptionalRiders(StringUtils.defaultString(plan.getOptionalRiders(), ""));
            safesMedicalPlan.setOptstatespecific1(StringUtils.defaultString(plan.getOptstatespecific1(), ""));
            safesMedicalPlan.setOptstatespecific2(StringUtils.defaultString(plan.getOptstatespecific2(), ""));
            safesMedicalPlan.setOptstatespecific3(StringUtils.defaultString(plan.getOptstatespecific3(), ""));
            safesMedicalPlan.setOptstatespecific4(StringUtils.defaultString(plan.getOptstatespecific4(), ""));
            safesMedicalPlan.setOtherInnCoins(StringUtils.defaultString(plan.getOtherInnCoins(), ""));
            safesMedicalPlan.setPdl(StringUtils.defaultString(plan.getPdl(), ""));
            safesMedicalPlan.setPedDentalDedAppliesTo(StringUtils.defaultString(plan.getPedDentalDedAppliesTo(), ""));
            safesMedicalPlan.setPedDentalDedStrategy(StringUtils.defaultString(plan.getPedDentalDedStrategy(), ""));
            safesMedicalPlan.setPedDentalProdType(StringUtils.defaultString(plan.getPedDentalProdType(), ""));
            safesMedicalPlan.setPediatricDentalAdminCode(StringUtils.defaultString(plan.getPediatricDentalAdminCode(), ""));
            safesMedicalPlan.setPediatricVisionAdminCode(StringUtils.defaultString(plan.getPediatricVisionAdminCode(), ""));
            safesMedicalPlan.setPedVisionDedAppliesTo(StringUtils.defaultString(plan.getPedVisionDedAppliesTo(), ""));
            safesMedicalPlan.setPedVisionDedIncInMed(StringUtils.defaultString(plan.getPedVisionDedIncInMed(), ""));
            safesMedicalPlan.setPlanCategory(StringUtils.defaultString(plan.getPlanCategory(), ""));
            safesMedicalPlan.setPlanCategory2(StringUtils.defaultString(plan.getPlanCategory2(), ""));
            safesMedicalPlan.setPlanCategory3(StringUtils.defaultString(plan.getPlanCategory3(), ""));
            safesMedicalPlan.setPlanCategory4(StringUtils.defaultString(plan.getPlanCategory4(), ""));
            safesMedicalPlan.setPlanCodeNICERewardsPremiumOption(StringUtils.defaultString(plan.getPlanCodeNICERewardsPremiumOption(), ""));
            safesMedicalPlan.setPlanHaveCopay(StringUtils.defaultString(plan.getPlanHaveCopay(), ""));
            safesMedicalPlan.setPlanOfferCompositeRating(StringUtils.defaultString(plan.getPlanOfferCompositeRating(), ""));
            safesMedicalPlan.setPlanSelectionCode(StringUtils.defaultString(plan.getPlanSelectionCode(), ""));
            safesMedicalPlan.setPlanStringLitteral(StringUtils.defaultString(plan.getPlanStringLitteral(), ""));
            safesMedicalPlan.setPlatform(StringUtils.defaultString(plan.getPlatform(), ""));
            safesMedicalPlan.setPocVsPod(StringUtils.defaultString(plan.getPocvspod(), ""));
            safesMedicalPlan.setPolicyMaximum(StringUtils.defaultString(plan.getPolicyMaximum(), ""));
            safesMedicalPlan.setPortalSupressBrokEmp(StringUtils.defaultString(plan.getPortalSupressBrokEmp(), ""));
            safesMedicalPlan.setPRDate(StringUtils.defaultString(plan.getPRDate(), ""));
            safesMedicalPlan.setPreDedAllowAllBenefit(StringUtils.defaultString(plan.getPreDedAllowAllBenefit(), ""));
            safesMedicalPlan.setPreDedAllowAmbErOnly(StringUtils.defaultString(plan.getPreDedAllowAmbErOnly(), ""));
            safesMedicalPlan.setPreDedAllowAmbErOthers(StringUtils.defaultString(plan.getPreDedAllowAmbErOthers(), ""));
            safesMedicalPlan.setPreDedAllowOthers(StringUtils.defaultString(plan.getPreDedAllowOthers(), ""));
            safesMedicalPlan.setPreferredLabNetwork(StringUtils.defaultString(plan.getPreferredLabNetwork(), ""));
            safesMedicalPlan.setPrimeNetworkCodeA(StringUtils.defaultString(plan.getPrimeNetworkCodeA(), ""));
            safesMedicalPlan.setPrimeNetworkCodeB(StringUtils.defaultString(plan.getPrimeNetworkCodeB(), ""));
            safesMedicalPlan.setPrimeNetworkCodeC(StringUtils.defaultString(plan.getPrimeNetworkCodeC(), ""));
            safesMedicalPlan.setPrimeNetworkCodeD(StringUtils.defaultString(plan.getPrimeNetworkCodeD(), ""));
            safesMedicalPlan.setPrimeNetworkCodeE(StringUtils.defaultString(plan.getPrimeNetworkCodeE(), ""));
            safesMedicalPlan.setPrimeNetworkCodeF(StringUtils.defaultString(plan.getPrimeNetworkCodeF(), ""));
            safesMedicalPlan.setPrimeNetworkCodeG(StringUtils.defaultString(plan.getPrimeNetworkCodeG(), ""));
            safesMedicalPlan.setPrimeProdType(StringUtils.defaultString(plan.getPrimeProdType(), ""));
            safesMedicalPlan.setPriorHiosId(StringUtils.defaultString(plan.getPriorHiosId(), ""));
            safesMedicalPlan.setPriorTrackingNumbers(StringUtils.defaultString(plan.getPriorTrackingNumbers(), ""));
            safesMedicalPlan.setProduct(StringUtils.defaultString(plan.getProduct(), ""));
            safesMedicalPlan.setProductName(StringUtils.defaultString(plan.getProductName(), ""));
            safesMedicalPlan.setProductType(StringUtils.defaultString(plan.getProductType(), ""));
            safesMedicalPlan.setProviderNetwork(StringUtils.defaultString(plan.getProviderNetwork(), ""));
            safesMedicalPlan.setRatingArea(StringUtils.defaultString(plan.getRatingArea(), ""));
            safesMedicalPlan.setRatingAreaA(StringUtils.defaultString(plan.getRatingAreaA(), ""));
            safesMedicalPlan.setRatingAreaB(StringUtils.defaultString(plan.getRatingAreaB(), ""));
            safesMedicalPlan.setRatingAreaC(StringUtils.defaultString(plan.getRatingAreaC(), ""));
            safesMedicalPlan.setRatingAreaD(StringUtils.defaultString(plan.getRatingAreaD(), ""));
            safesMedicalPlan.setRetiredDate(StringUtils.defaultString(plan.getRetiredDate(), ""));
            safesMedicalPlan.setRenewalBatchFromDate(StringUtils.defaultString(plan.getRenewalBatchFromDate(), ""));
            safesMedicalPlan.setRenewalBatchThruDate(StringUtils.defaultString(plan.getRenewalBatchThruDate(), ""));
            safesMedicalPlan.setRenewalQuoteFromDate(StringUtils.defaultString(plan.getRenewalQuoteFromDate(), ""));
            safesMedicalPlan.setRenewalQuoteThruDate(StringUtils.defaultString(plan.getRenewalQuoteThruDate(), ""));
            safesMedicalPlan.setRowNumber(StringUtils.defaultString(plan.getRowNumber(), ""));
            safesMedicalPlan.setRpdProductSubcategories(StringUtils.defaultString(plan.getRpdProductSubcategories(), ""));
            safesMedicalPlan.setRulePackageKey(StringUtils.defaultString(plan.getRulePackageKey(), ""));
            safesMedicalPlan.setRxNetwork(StringUtils.defaultString(plan.getRxNetwork(), ""));
            safesMedicalPlan.setRxPlans(StringUtils.defaultString(plan.getRxPlans(), ""));
            safesMedicalPlan.setSegment(StringUtils.defaultString(plan.getSegment(), ""));
            safesMedicalPlan.setSegmentRange(StringUtils.defaultString(plan.getSegmentRange(), ""));
            safesMedicalPlan.setServiceArea(StringUtils.defaultString(plan.getServiceArea(), ""));
            safesMedicalPlan.setServiceAreaA(StringUtils.defaultString(plan.getServiceAreaA(), ""));
            safesMedicalPlan.setServiceAreaB(StringUtils.defaultString(plan.getServiceAreaB(), ""));
            safesMedicalPlan.setServiceAreaC(StringUtils.defaultString(plan.getServiceAreaC(), ""));
            safesMedicalPlan.setServiceAreaD(StringUtils.defaultString(plan.getServiceAreaD(), ""));
            safesMedicalPlan.setSpecialtyVisionRider(StringUtils.defaultString(plan.getSpecialtyVisionRider(), ""));
            safesMedicalPlan.setSqlId(StringUtils.defaultString(plan.getId(), ""));
            safesMedicalPlan.setSrgId(StringUtils.defaultString(plan.getSrgId(), ""));
            safesMedicalPlan.setStandard(StringUtils.defaultString(plan.getStandard(), ""));
            safesMedicalPlan.setStandardLabNetwork(StringUtils.defaultString(plan.getStandardLabNetwork(), ""));
            safesMedicalPlan.setStandardMajorRadiologyNetwork(StringUtils.defaultString(plan.getStandardMajorRadiologyNetwork(), ""));
            safesMedicalPlan.setStartSimple(StringUtils.defaultString(plan.getStartSimple(), ""));
            safesMedicalPlan.setStateAbbr(StringUtils.defaultString(plan.getStateAbbr(), ""));
            safesMedicalPlan.setSurestCode(StringUtils.defaultString(plan.getSurestCode(), ""));
            safesMedicalPlan.setSurestProduct(StringUtils.defaultString(plan.getSurestProduct(), ""));
            safesMedicalPlan.setTabId(StringUtils.defaultString(plan.getTabId(), ""));
            safesMedicalPlan.setTrackingNumbers(StringUtils.defaultString(plan.getTrackingNumbers(), ""));
            safesMedicalPlan.setUesDisplay(StringUtils.defaultString(plan.getUesDisplay(), ""));
            safesMedicalPlan.setUhcInnBasePhysicianCoins(StringUtils.defaultString(plan.getUhcInnBasePhysicianCoins(), ""));
            safesMedicalPlan.setUhcInnCoinsDesigNetworkPcpObgyn(StringUtils.defaultString(plan.getUhcInnCoinsDesigNetworkPcpObgyn(), ""));
            safesMedicalPlan.setUhcInnCoinsDesigNetworkWithReferral(StringUtils.defaultString(plan.getUhcInnCoinsDesigNetworkWithReferral(), ""));
            safesMedicalPlan.setUhcInnCoinsDesigNetworkWithoutReferral(StringUtils.defaultString(plan.getUhcInnCoinsDesigNetworkWithoutReferral(), ""));
            safesMedicalPlan.setUhcInnCoinsNetworkPcpObgyn(StringUtils.defaultString(plan.getUhcInnCoinsNetworkPcpObgyn(), ""));
            safesMedicalPlan.setUhcInnCoinsNetworkWithReferral(StringUtils.defaultString(plan.getUhcInnCoinsNetworkWithReferral(), ""));
            safesMedicalPlan.setUhcInnCoinsNetworkWithoutReferral(StringUtils.defaultString(plan.getUhcInnCoinsNetworkWithoutReferral(), ""));
            safesMedicalPlan.setUhcInnCoinsTier1(StringUtils.defaultString(plan.getUhcInnCoinsTier1(), ""));
            safesMedicalPlan.setUhcInnCoinsTier2(StringUtils.defaultString(plan.getUhcInnCoinsTier2(), ""));
            safesMedicalPlan.setUhcInnCoinsWithOutReferral(StringUtils.defaultString(plan.getUhcInnCoinsWithOutReferral(), ""));
            safesMedicalPlan.setUhcInnDesignatedPcpCoins(StringUtils.defaultString(plan.getUhcInnDesignatedPcpCoins(), ""));
            safesMedicalPlan.setUhcInnDesignatedSpecCoins(StringUtils.defaultString(plan.getUhcInnDesignatedSpecCoins(), ""));
            safesMedicalPlan.setUhcInnNonDesignatedPcpCoins(StringUtils.defaultString(plan.getUhcInnNonDesignatedPcpCoins(), ""));
            safesMedicalPlan.setUhcInnNonDesignatedSpecCoins(StringUtils.defaultString(plan.getUhcInnNonDesignatedSpecCoins(), ""));
            safesMedicalPlan.setUhcInnNonPhysicianCoins(StringUtils.defaultString(plan.getUhcInnNonPhysicianCoins(), ""));
            safesMedicalPlan.setUhcInnPcpCoinsDesigNetwork(StringUtils.defaultString(plan.getUhcInnPcpCoinsDesigNetwork(), ""));
            safesMedicalPlan.setUhcInnPcpCoinsNetwork(StringUtils.defaultString(plan.getUhcInnPcpCoinsNetwork(), ""));
            safesMedicalPlan.setUhcInnSpecCoinsDesigNetwork(StringUtils.defaultString(plan.getUhcInnSpecCoinsDesigNetwork(), ""));
            safesMedicalPlan.setUhcInnSpecCoinsNetwork(StringUtils.defaultString(plan.getUhcInnSpecCoinsNetwork(), ""));
            safesMedicalPlan.setUhcMotionRiderCode(StringUtils.defaultString(plan.getUhcMotionRiderCode(), ""));
            safesMedicalPlan.setUhcRewardsPrem(StringUtils.defaultString(plan.getUhcRewardsPrem(), ""));
            safesMedicalPlan.setUmPlanDetermination(StringUtils.defaultString(plan.getUmPlanDetermination(), ""));
            safesMedicalPlan.setUniquePlanDesign(StringUtils.defaultString(plan.getUniquePlanDesign(), ""));
            safesMedicalPlan.setVisitLimits(StringUtils.defaultString(plan.getVisitLimits(), ""));
            safesMedicalPlan.setWhichVisitLimitsCombined(StringUtils.defaultString(plan.getWhichVisitLimitsCombined(), ""));
        } catch (Exception e) {
            logger.error("Error building safes medical plan", e);
        }
        return safesMedicalPlan;
    }


    private SafesPortfolio buildSafesRxPlan(DataWarehouseRx plan) {
        SafesPortfolio rxPlan = new SafesPortfolio();
        try {
            rxPlan.setPlanType("Pharmacy");
            rxPlan.setStateAbbr(StringUtils.defaultString(plan.getStateAbbr(), ""));
            rxPlan.setCocSeries(StringUtils.defaultString(DataWarehouseUtil.extractCocSeries(plan.getGridName()), ""));
            rxPlan.setOrganization(StringUtils.defaultString(DataWarehouseUtil.extractOrganization(plan.getGridName(), plan.getTabName(), "", PortfolioType.SAFES_PORTFOLIO, null), ""));

            rxPlan.setCEDate(StringUtils.defaultString(plan.getCEDate(), ""));
            rxPlan.setDescription(StringUtils.defaultString(plan.getDescription(), ""));
            rxPlan.setDiscontinuedDate(StringUtils.defaultString(plan.getDiscontinuedDate(), ""));
            rxPlan.setMarketCodes(StringUtils.defaultString(plan.getMarketCodes(), ""));
            rxPlan.setPRDate(StringUtils.defaultString(plan.getPRDate(), ""));
            rxPlan.setRetiredDate(StringUtils.defaultString(plan.getRetiredDate(), ""));
            rxPlan.setSegment(StringUtils.defaultString(plan.getSegment(), ""));
            rxPlan.setSegmentRange(StringUtils.defaultString(plan.getSegmentRange(), ""));
            rxPlan.setStandard(StringUtils.defaultString(plan.getStandard(), ""));
            rxPlan.setTrackingNumbers(StringUtils.defaultString(plan.getRxTracking(), ""));
            rxPlan.setFileId(StringUtils.defaultString(plan.getFileId(), ""));
            rxPlan.setTabId(StringUtils.defaultString(plan.getTabId(), ""));
            rxPlan.setRowNumber(StringUtils.defaultString(plan.getRowNumber(), ""));
            rxPlan.setFamilyDeductible(StringUtils.defaultString(plan.getFamilyDeductible(), ""));
            rxPlan.setFamilyOopm(StringUtils.defaultString(plan.getFamilyOopm(), ""));
            rxPlan.setHmoLicense(StringUtils.defaultString(plan.getHmoLicense(), ""));
            rxPlan.setIndividualDeductible(StringUtils.defaultString(plan.getIndividualDeductible(), ""));
            rxPlan.setIndividualOopm(StringUtils.defaultString(plan.getIndividualOopm(), ""));
            rxPlan.setInsuranceLicense(StringUtils.defaultString(plan.getInsuranceLicense(), ""));
            rxPlan.setIsAcisBplPreBuild(StringUtils.defaultString(plan.getIsAcisBplPreBuild(), ""));
            rxPlan.setIsAncillaryCharge(StringUtils.defaultString(plan.getIsAncillaryCharge(), ""));
            rxPlan.setIsCombinedMedRxDeductible(StringUtils.defaultString(plan.getIsCombinedMedRxDeductible(), ""));
            rxPlan.setIsPrimeBplPreBuild(StringUtils.defaultString(plan.getIsPrimeBplPreBuild(), ""));
            rxPlan.setMailServiceRatio(StringUtils.defaultString(plan.getMailServiceRatio(), ""));
            rxPlan.setNotes(StringUtils.defaultString(plan.getNotes(), ""));
            rxPlan.setNumberOfTiers(StringUtils.defaultString(plan.getNumberOfTiers(), ""));
            rxPlan.setPharmacyRetailNetwork(StringUtils.defaultString(plan.getPharmacyRetailNetwork(), ""));
            rxPlan.setPrescriptionDrugList(StringUtils.defaultString(plan.getPrescriptionDrugList(), ""));
            rxPlan.setRxCode(StringUtils.defaultString(plan.getRxCode(), ""));
            rxPlan.setSepRxDedAppliesToTier1(StringUtils.defaultString(plan.getSepRxDedAppliesToTier1(), ""));
            rxPlan.setSepRxDedAppliesToWhatTiers(StringUtils.defaultString(plan.getSepRxDedAppliesToWhatTiers(), ""));
            rxPlan.setTier1CopayMax(StringUtils.defaultString(plan.getTier1CopayMax(), ""));
            rxPlan.setTier1CopayMin(StringUtils.defaultString(plan.getTier1CopayMin(), ""));
            rxPlan.setTier1CostShare(StringUtils.defaultString(plan.getTier1CostShare(), ""));
            rxPlan.setTier1SpecCopayMax(StringUtils.defaultString(plan.getTier1SpecCopayMax(), ""));
            rxPlan.setTier1SpecCopayMin(StringUtils.defaultString(plan.getTier1SpecCopayMin(), ""));
            rxPlan.setTier1SpecCostShare(StringUtils.defaultString(plan.getTier1SpecCostShare(), ""));
            rxPlan.setTier2CopayMax(StringUtils.defaultString(plan.getTier2CopayMax(), ""));
            rxPlan.setTier2CopayMin(StringUtils.defaultString(plan.getTier2CopayMin(), ""));
            rxPlan.setTier2CostShare(StringUtils.defaultString(plan.getTier2CostShare(), ""));
            rxPlan.setTier2SpecCopayMax(StringUtils.defaultString(plan.getTier2SpecCopayMax(), ""));
            rxPlan.setTier2SpecCopayMin(StringUtils.defaultString(plan.getTier2SpecCopayMin(), ""));
            rxPlan.setTier2SpecCostShare(StringUtils.defaultString(plan.getTier2SpecCostShare(), ""));
            rxPlan.setTier3CopayMax(StringUtils.defaultString(plan.getTier3CopayMax(), ""));
            rxPlan.setTier3CopayMin(StringUtils.defaultString(plan.getTier3CopayMin(), ""));
            rxPlan.setTier3CostShare(StringUtils.defaultString(plan.getTier3CostShare(), ""));
            rxPlan.setTier3SpecCopayMax(StringUtils.defaultString(plan.getTier3SpecCopayMax(), ""));
            rxPlan.setTier3SpecCopayMin(StringUtils.defaultString(plan.getTier3SpecCopayMin(), ""));
            rxPlan.setTier3SpecCostShare(StringUtils.defaultString(plan.getTier3SpecCostShare(), ""));
            rxPlan.setTier4CopayMax(StringUtils.defaultString(plan.getTier4CopayMax(), ""));
            rxPlan.setTier4CopayMin(StringUtils.defaultString(plan.getTier4CopayMin(), ""));
            rxPlan.setTier4CostShare(StringUtils.defaultString(plan.getTier4CostShare(), ""));
            rxPlan.setTier4SpecCopayMax(StringUtils.defaultString(plan.getTier4SpecCopayMax(), ""));
            rxPlan.setTier4SpecCopayMin(StringUtils.defaultString(plan.getTier4SpecCopayMin(), ""));
            rxPlan.setTier4SpecCostShare(StringUtils.defaultString(plan.getTier4SpecCostShare(), ""));
            rxPlan.setDedAppliesToWhichPharmacyTier(StringUtils.defaultString(plan.getDedAppliesToWhichPharmacyTier(), ""));
            rxPlan.setRxDescriptor(StringUtils.defaultString(plan.getRxDescriptor(), ""));
            rxPlan.setDedAppliesTo(StringUtils.defaultString(plan.getDedAppliesTo(), ""));
            rxPlan.setApplicableLicense(StringUtils.defaultString(plan.getApplicableLicense(), ""));
            rxPlan.setFamilyDeductibleOptions(StringUtils.defaultString(plan.getFamilyDeductibleOptions(), ""));
            rxPlan.setIndividualDeductibleOptions(StringUtils.defaultString(plan.getIndividualDeductibleOptions(), ""));
            rxPlan.setRxCodeNICE(StringUtils.defaultString(plan.getRxCodeNICE(), ""));
            rxPlan.setSelfInjectable(StringUtils.defaultString(plan.getSelfInjectable(), ""));
            rxPlan.setPreferredNetworkPharmacy(StringUtils.defaultString(plan.getPreferredNetworkPharmacy(), ""));
            rxPlan.setPreferredDedAppliesToWhichPharmacyTier(StringUtils.defaultString(plan.getPreferredDedAppliesToWhichPharmacyTier(), ""));
            rxPlan.setPreferredTier1CostShare(StringUtils.defaultString(plan.getPreferredTier1CostShare(), ""));
            rxPlan.setPreferredTier1CopayMin(StringUtils.defaultString(plan.getPreferredTier1CopayMin(), ""));
            rxPlan.setPreferredTier1CopayMax(StringUtils.defaultString(plan.getPreferredTier1CopayMax(), ""));
            rxPlan.setPreferredTier2CostShare(StringUtils.defaultString(plan.getPreferredTier2CostShare(), ""));
            rxPlan.setPreferredTier2CopayMin(StringUtils.defaultString(plan.getPreferredTier2CopayMin(), ""));
            rxPlan.setPreferredTier2CopayMax(StringUtils.defaultString(plan.getPreferredTier2CopayMax(), ""));
            rxPlan.setPreferredTier3CostShare(StringUtils.defaultString(plan.getPreferredTier3CostShare(), ""));
            rxPlan.setPreferredTier3CopayMin(StringUtils.defaultString(plan.getPreferredTier3CopayMin(), ""));
            rxPlan.setPreferredTier3CopayMax(StringUtils.defaultString(plan.getPreferredTier3CopayMax(), ""));
            rxPlan.setPreferredTier4CostShare(StringUtils.defaultString(plan.getPreferredTier4CostShare(), ""));
            rxPlan.setPreferredTier4CopayMin(StringUtils.defaultString(plan.getPreferredTier4CopayMin(), ""));
            rxPlan.setPreferredTier4CopayMax(StringUtils.defaultString(plan.getPreferredTier4CopayMax(), ""));
            rxPlan.setPreferredTier5CostShare(StringUtils.defaultString(plan.getPreferredTier5CostShare(), ""));
            rxPlan.setPreferredTier5CopayMin(StringUtils.defaultString(plan.getPreferredTier5CopayMin(), ""));
            rxPlan.setPreferredTier5CopayMax(StringUtils.defaultString(plan.getPreferredTier5CopayMax(), ""));
            rxPlan.setTier5CostShare(StringUtils.defaultString(plan.getTier5CostShare(), ""));
            rxPlan.setTier5CopayMin(StringUtils.defaultString(plan.getTier5CopayMin(), ""));
            rxPlan.setTier5CopayMax(StringUtils.defaultString(plan.getTier5CopayMax(), ""));
            rxPlan.setPreferredRetail90Days(StringUtils.defaultString(plan.getPreferredRetail90Days(), ""));
            rxPlan.setRetail90Days(StringUtils.defaultString(plan.getRetail90Days(), ""));
            rxPlan.setHomeDelivery90Days(StringUtils.defaultString(plan.getHomeDelivery90Days(), ""));
            rxPlan.setPreferredMailServiceRatio(StringUtils.defaultString(plan.getPreferredMailServiceRatio(), ""));
            rxPlan.setRxStringLiteral(StringUtils.defaultString(plan.getRxStringLiteral(), ""));
            rxPlan.setPreventiveCostShare(StringUtils.defaultString(plan.getPreventiveCostShare(), ""));
            rxPlan.setPreferredTier1HomeDeliveryCostShare(StringUtils.defaultString(plan.getPreferredTier1HomeDeliveryCostShare(), ""));
            rxPlan.setPreferredTier2HomeDeliveryCostShare(StringUtils.defaultString(plan.getPreferredTier2HomeDeliveryCostShare(), ""));
            rxPlan.setPreferredTier3HomeDeliveryCostShare(StringUtils.defaultString(plan.getPreferredTier3HomeDeliveryCostShare(), ""));
            rxPlan.setPreferredTier4HomeDeliveryCostShare(StringUtils.defaultString(plan.getPreferredTier4HomeDeliveryCostShare(), ""));
            rxPlan.setPreferredTier4HomeDeliveryCopayMin(StringUtils.defaultString(plan.getPreferredTier4HomeDeliveryCopayMin(), ""));
            rxPlan.setPreferredTier4HomeDeliveryCopayMax(StringUtils.defaultString(plan.getPreferredTier4HomeDeliveryCopayMax(), ""));
            rxPlan.setPreferredTier5HomeDeliveryCostShare(StringUtils.defaultString(plan.getPreferredTier5HomeDeliveryCostShare(), ""));
            rxPlan.setPreferredTier5HomeDeliveryCopayMin(StringUtils.defaultString(plan.getPreferredTier5HomeDeliveryCopayMin(), ""));
            rxPlan.setPreferredTier5HomeDeliveryCopayMax(StringUtils.defaultString(plan.getPreferredTier5HomeDeliveryCopayMax(), ""));
            rxPlan.setTier1HomeDeliveryCostShare(StringUtils.defaultString(plan.getTier1HomeDeliveryCostShare(), ""));
            rxPlan.setTier2HomeDeliveryCostShare(StringUtils.defaultString(plan.getTier2HomeDeliveryCostShare(), ""));
            rxPlan.setTier3HomeDeliveryCostShare(StringUtils.defaultString(plan.getTier3HomeDeliveryCostShare(), ""));
            rxPlan.setTier4HomeDeliveryCostShare(StringUtils.defaultString(plan.getTier4HomeDeliveryCostShare(), ""));
            rxPlan.setTier4HomeDeliveryCopayMin(StringUtils.defaultString(plan.getTier4HomeDeliveryCopayMin(), ""));
            rxPlan.setTier4HomeDeliveryCopayMax(StringUtils.defaultString(plan.getTier4HomeDeliveryCopayMax(), ""));
            rxPlan.setTier5HomeDeliveryCostShare(StringUtils.defaultString(plan.getTier5HomeDeliveryCostShare(), ""));
            rxPlan.setTier5HomeDeliveryCopayMin(StringUtils.defaultString(plan.getTier5HomeDeliveryCopayMin(), ""));
            rxPlan.setTier5HomeDeliveryCopayMax(StringUtils.defaultString(plan.getTier5HomeDeliveryCopayMax(), ""));
            rxPlan.setHomeDeliveryRatio(StringUtils.defaultString(plan.getHomeDeliveryRatio(), ""));
            rxPlan.setDedAppliesTier1(StringUtils.defaultString(plan.getDedAppliesTier1(), ""));
            rxPlan.setDedAppliesTier2(StringUtils.defaultString(plan.getDedAppliesTier2(), ""));
            rxPlan.setTier2HomeDeliveryCopayMax(StringUtils.defaultString(plan.getTier2HomeDeliveryCopayMax(), ""));
            rxPlan.setDedAppliesTier3(StringUtils.defaultString(plan.getDedAppliesTier3(), ""));
            rxPlan.setTier3HomeDeliveryCopayMax(StringUtils.defaultString(plan.getTier3HomeDeliveryCopayMax(), ""));
            rxPlan.setDedAppliesTier4(StringUtils.defaultString(plan.getDedAppliesTier4(), ""));
            rxPlan.setDedAppliesTier5(StringUtils.defaultString(plan.getDedAppliesTier5(), ""));
            rxPlan.setDedAppliesTier6(StringUtils.defaultString(plan.getDedAppliesTier6(), ""));
            rxPlan.setPreferredTier6CostShare(StringUtils.defaultString(plan.getPreferredTier6CostShare(), ""));
            rxPlan.setPreferredTier6CopayMax(StringUtils.defaultString(plan.getPreferredTier6CopayMax(), ""));
            rxPlan.setTier6CostShare(StringUtils.defaultString(plan.getTier6CostShare(), ""));
            rxPlan.setTier6CopayMax(StringUtils.defaultString(plan.getTier6CopayMax(), ""));
            rxPlan.setTier6HomeDeliveryCostShare(StringUtils.defaultString(plan.getTier6HomeDeliveryCostShare(), ""));
            rxPlan.setTier6HomeDeliveryCopayMax(StringUtils.defaultString(plan.getTier6HomeDeliveryCopayMax(), ""));
            rxPlan.setIsCombinedMedRxOOPM(StringUtils.defaultString(plan.getIsCombinedMedRxOOPM(), ""));
            rxPlan.setDedAppliesPreferredTier1(StringUtils.defaultString(plan.getDedAppliesPreferredTier1(), ""));
            rxPlan.setDedAppliesPreferredTier2(StringUtils.defaultString(plan.getDedAppliesPreferredTier2(), ""));
            rxPlan.setDedAppliesPreferredTier3(StringUtils.defaultString(plan.getDedAppliesPreferredTier3(), ""));
            rxPlan.setDedAppliesPreferredTier4(StringUtils.defaultString(plan.getDedAppliesPreferredTier4(), ""));
            rxPlan.setDedAppliesPreferredTier5(StringUtils.defaultString(plan.getDedAppliesPreferredTier5(), ""));
            rxPlan.setDedAppliesPreferredTier6(StringUtils.defaultString(plan.getDedAppliesPreferredTier6(), ""));
            rxPlan.setOneMonthSupply(StringUtils.defaultString(plan.getOneMonthSupply(), ""));
            rxPlan.setDaySupplyLimitPreferredRetail(StringUtils.defaultString(plan.getDaySupplyLimitPreferredRetail(), ""));
            rxPlan.setDaySupplyLimitRetail(StringUtils.defaultString(plan.getDaySupplyLimitRetail(), ""));
            rxPlan.setDaySupplyLimitHomeDelivery(StringUtils.defaultString(plan.getDaySupplyLimitHomeDelivery(), ""));
            rxPlan.setNewBusinessOrRenewal(StringUtils.defaultString(plan.getNewBusinessOrRenewal(), ""));
            rxPlan.setInsulin(StringUtils.defaultString(plan.getInsulin(), ""));
            rxPlan.setOonTier1CostShare(StringUtils.defaultString(plan.getOonTier1CostShare(), ""));
            rxPlan.setOonTier2CostShare(StringUtils.defaultString(plan.getOonTier2CostShare(), ""));
            rxPlan.setOonTier3CostShare(StringUtils.defaultString(plan.getOonTier3CostShare(), ""));
            rxPlan.setSpecialtyDrugListDaySupplyLimit(StringUtils.defaultString(plan.getSpecialtyDrugListDaySupplyLimit(), ""));
            rxPlan.setTier1RetailNetworkCostShare(StringUtils.defaultString(plan.getTier1RetailNetworkCostShare(), ""));
            rxPlan.setTier2RetailNetworkCostShare(StringUtils.defaultString(plan.getTier2RetailNetworkCostShare(), ""));
            rxPlan.setTier2RetailNetworkCostShareMax(StringUtils.defaultString(plan.getTier2RetailNetworkCostShareMax(), ""));
            rxPlan.setTier3RetailNetworkCostShare(StringUtils.defaultString(plan.getTier3RetailNetworkCostShare(), ""));
            rxPlan.setTier3RetailNetworkCostShareMax(StringUtils.defaultString(plan.getTier3RetailNetworkCostShareMax(), ""));
            rxPlan.setTier4RetailNetworkCostShare(StringUtils.defaultString(plan.getTier4RetailNetworkCostShare(), ""));
            rxPlan.setTier4RetailNetworkCostShareMax(StringUtils.defaultString(plan.getTier4RetailNetworkCostShareMax(), ""));
            rxPlan.setTier5RetailNetworkCostShare(StringUtils.defaultString(plan.getTier5RetailNetworkCostShare(), ""));
            rxPlan.setTier5RetailNetworkCostShareMax(StringUtils.defaultString(plan.getTier5RetailNetworkCostShareMax(), ""));
            rxPlan.setTier6RetailNetworkCostShare(StringUtils.defaultString(plan.getTier6RetailNetworkCostShare(), ""));
            rxPlan.setTier6RetailNetworkCostShareMax(StringUtils.defaultString(plan.getTier6RetailNetworkCostShareMax(), ""));
            rxPlan.setRxCodeSurest(StringUtils.defaultString(plan.getRxCodeSurest(), ""));
            rxPlan.setIsBuyUpTier1(StringUtils.defaultString(plan.getIsBuyUpTier1(), ""));
            rxPlan.setIsBuyUpTier2(StringUtils.defaultString(plan.getIsBuyUpTier2(), ""));
            rxPlan.setIsBuyUpTier3(StringUtils.defaultString(plan.getIsBuyUpTier3(), ""));
            rxPlan.setTier1BenefitCode30Days(StringUtils.defaultString(plan.getTier1BenefitCode30Days(), ""));
            rxPlan.setTier1BenefitCode90Days(StringUtils.defaultString(plan.getTier1BenefitCode90Days(), ""));
            rxPlan.setTier1BenefitCodeSpecialty(StringUtils.defaultString(plan.getTier1BenefitCodeSpecialty(), ""));
            rxPlan.setTier1Copay30Days(StringUtils.defaultString(plan.getTier1Copay30Days(), ""));
            rxPlan.setTier1Copay90Days(StringUtils.defaultString(plan.getTier1Copay90Days(), ""));
            rxPlan.setTier1CopaySpecialty(StringUtils.defaultString(plan.getTier1CopaySpecialty(), ""));
            rxPlan.setTier1DedApplies30Days(StringUtils.defaultString(plan.getTier1DedApplies30Days(), ""));
            rxPlan.setTier1DedApplies90Days(StringUtils.defaultString(plan.getTier1DedApplies90Days(), ""));
            rxPlan.setTier1DedAppliesSpecialty(StringUtils.defaultString(plan.getTier1DedAppliesSpecialty(), ""));
            rxPlan.setTier1HasOonCoverage30Days(StringUtils.defaultString(plan.getTier1HasOonCoverage30Days(), ""));
            rxPlan.setTier1HasOonCoverage90Days(StringUtils.defaultString(plan.getTier1HasOonCoverage90Days(), ""));
            rxPlan.setTier1HasOonCoverageSpecialty(StringUtils.defaultString(plan.getTier1HasOonCoverageSpecialty(), ""));
            rxPlan.setTier1OonCostShare30Days(StringUtils.defaultString(plan.getTier1OonCostShare30Days(), ""));
            rxPlan.setTier1OonCostShare90Days(StringUtils.defaultString(plan.getTier1OonCostShare90Days(), ""));
            rxPlan.setTier1OonCostShareSpecialty(StringUtils.defaultString(plan.getTier1OonCostShareSpecialty(), ""));
            rxPlan.setTier2BenefitCode30Days(StringUtils.defaultString(plan.getTier2BenefitCode30Days(), ""));
            rxPlan.setTier2BenefitCode90Days(StringUtils.defaultString(plan.getTier2BenefitCode90Days(), ""));
            rxPlan.setTier2BenefitCodeSpecialty(StringUtils.defaultString(plan.getTier2BenefitCodeSpecialty(), ""));
            rxPlan.setTier2Copay30Days(StringUtils.defaultString(plan.getTier2Copay30Days(), ""));
            rxPlan.setTier2Copay90Days(StringUtils.defaultString(plan.getTier2Copay90Days(), ""));
            rxPlan.setTier2CopaySpecialty(StringUtils.defaultString(plan.getTier2CopaySpecialty(), ""));
            rxPlan.setTier2DedApplies30Days(StringUtils.defaultString(plan.getTier2DedApplies30Days(), ""));
            rxPlan.setTier2DedApplies90Days(StringUtils.defaultString(plan.getTier2DedApplies90Days(), ""));
            rxPlan.setTier2DedAppliesSpecialty(StringUtils.defaultString(plan.getTier2DedAppliesSpecialty(), ""));
            rxPlan.setTier2HasOonCoverage30Days(StringUtils.defaultString(plan.getTier2HasOonCoverage30Days(), ""));
            rxPlan.setTier2HasOonCoverage90Days(StringUtils.defaultString(plan.getTier2HasOonCoverage90Days(), ""));
            rxPlan.setTier2HasOonCoverageSpecialty(StringUtils.defaultString(plan.getTier2HasOonCoverageSpecialty(), ""));
            rxPlan.setTier2OonCostShare30Days(StringUtils.defaultString(plan.getTier2OonCostShare30Days(), ""));
            rxPlan.setTier2OonCostShare90Days(StringUtils.defaultString(plan.getTier2OonCostShare90Days(), ""));
            rxPlan.setTier2OonCostShareSpecialty(StringUtils.defaultString(plan.getTier2OonCostShareSpecialty(), ""));
            rxPlan.setTier3BenefitCode30Days(StringUtils.defaultString(plan.getTier3BenefitCode30Days(), ""));
            rxPlan.setTier3BenefitCode90Days(StringUtils.defaultString(plan.getTier3BenefitCode90Days(), ""));
            rxPlan.setTier3BenefitCodeSpecialty(StringUtils.defaultString(plan.getTier3BenefitCodeSpecialty(), ""));
            rxPlan.setTier3Copay30Days(StringUtils.defaultString(plan.getTier3Copay30Days(), ""));
            rxPlan.setTier3Copay90Days(StringUtils.defaultString(plan.getTier3Copay90Days(), ""));
            rxPlan.setTier3CopaySpecialty(StringUtils.defaultString(plan.getTier3CopaySpecialty(), ""));
            rxPlan.setTier3DedApplies30Days(StringUtils.defaultString(plan.getTier3DedApplies30Days(), ""));
            rxPlan.setTier3DedApplies90Days(StringUtils.defaultString(plan.getTier3DedApplies90Days(), ""));
            rxPlan.setTier3DedAppliesSpecialty(StringUtils.defaultString(plan.getTier3DedAppliesSpecialty(), ""));
            rxPlan.setTier3HasOonCoverage30Days(StringUtils.defaultString(plan.getTier3HasOonCoverage30Days(), ""));
            rxPlan.setTier3HasOonCoverage90Days(StringUtils.defaultString(plan.getTier3HasOonCoverage90Days(), ""));
            rxPlan.setTier3HasOonCoverageSpecialty(StringUtils.defaultString(plan.getTier3HasOonCoverageSpecialty(), ""));
            rxPlan.setTier3OonCostShare30Days(StringUtils.defaultString(plan.getTier3OonCostShare30Days(), ""));
            rxPlan.setTier3OonCostShare90Days(StringUtils.defaultString(plan.getTier3OonCostShare90Days(), ""));
            rxPlan.setTier3OonCostShareSpecialty(StringUtils.defaultString(plan.getTier3OonCostShareSpecialty(), ""));
            rxPlan.setTier1OonCostShare(StringUtils.defaultString(plan.getTier1OonCostShare(), ""));
            rxPlan.setTier1OonCostShare60Days(StringUtils.defaultString(plan.getTier1OonCostShare60Days(), ""));
            rxPlan.setTier1HasOonCoverage(StringUtils.defaultString(plan.getTier1HasOonCoverage(), ""));
            rxPlan.setTier1HasOonCoverage60Days(StringUtils.defaultString(plan.getTier1HasOonCoverage60Days(), ""));
            rxPlan.setTier1DedApplies(StringUtils.defaultString(plan.getTier1DedApplies(), ""));
            rxPlan.setTier1DedApplies60Days(StringUtils.defaultString(plan.getTier1DedApplies60Days(), ""));
            rxPlan.setTier1Copay(StringUtils.defaultString(plan.getTier1Copay(), ""));
            rxPlan.setTier1Copay60Days(StringUtils.defaultString(plan.getTier1Copay60Days(), ""));
            rxPlan.setTier1BenefitCode(StringUtils.defaultString(plan.getTier1BenefitCode(), ""));
            rxPlan.setTier1BenefitCode60Days(StringUtils.defaultString(plan.getTier1BenefitCode60Days(), ""));
            rxPlan.setTier2OonCostShare(StringUtils.defaultString(plan.getTier2OonCostShare(), ""));
            rxPlan.setTier2OonCostShare60Days(StringUtils.defaultString(plan.getTier2OonCostShare60Days(), ""));
            rxPlan.setTier2HasOonCoverage(StringUtils.defaultString(plan.getTier2HasOonCoverage(), ""));
            rxPlan.setTier2HasOonCoverage60Days(StringUtils.defaultString(plan.getTier2HasOonCoverage60Days(), ""));
            rxPlan.setTier2DedApplies(StringUtils.defaultString(plan.getTier2DedApplies(), ""));
            rxPlan.setTier2DedApplies60Days(StringUtils.defaultString(plan.getTier2DedApplies60Days(), ""));
            rxPlan.setTier2Copay(StringUtils.defaultString(plan.getTier2Copay(), ""));
            rxPlan.setTier2Copay60Days(StringUtils.defaultString(plan.getTier2Copay60Days(), ""));
            rxPlan.setTier2BenefitCode(StringUtils.defaultString(plan.getTier2BenefitCode(), ""));
            rxPlan.setTier2BenefitCode60Days(StringUtils.defaultString(plan.getTier2BenefitCode60Days(), ""));
            rxPlan.setTier3OonCostShare(StringUtils.defaultString(plan.getTier3OonCostShare(), ""));
            rxPlan.setTier3OonCostShare60Days(StringUtils.defaultString(plan.getTier3OonCostShare60Days(), ""));
            rxPlan.setTier3HasOonCoverage(StringUtils.defaultString(plan.getTier3HasOonCoverage(), ""));
            rxPlan.setTier3HasOonCoverage60Days(StringUtils.defaultString(plan.getTier3HasOonCoverage60Days(), ""));
            rxPlan.setTier3DedApplies(StringUtils.defaultString(plan.getTier3DedApplies(), ""));
            rxPlan.setTier3DedApplies60Days(StringUtils.defaultString(plan.getTier3DedApplies60Days(), ""));
            rxPlan.setTier3Copay(StringUtils.defaultString(plan.getTier3Copay(), ""));
            rxPlan.setTier3Copay60Days(StringUtils.defaultString(plan.getTier3Copay60Days(), ""));
            rxPlan.setTier3BenefitCode(StringUtils.defaultString(plan.getTier3BenefitCode(), ""));
            rxPlan.setTier3BenefitCode60Days(StringUtils.defaultString(plan.getTier3BenefitCode60Days(), ""));
            rxPlan.setNotCoveredCostShare(StringUtils.defaultString(plan.getNotCoveredCostShare(), ""));
        } catch (Exception e) {
            logger.error("Error in buildSafesRxPlan", e);
        }
        return rxPlan;
    }
}
