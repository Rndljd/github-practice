package com.optum.shop.service;
import com.optum.shop.enums.PortfolioType;
import com.optum.shop.mongodb.model.PrimePortfolio;
import com.optum.shop.pgt.model.DataWarehousePlan;
import com.optum.shop.pgt.model.DataWarehouseRx;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
@Component
public class SchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(SchedulerService.class);

    @Autowired
    private PrimePortfolioService primePortfolioService;

    @Autowired
    private SafesPortfolioService safesPortfolioService;

    private static final String PRIME_PORTFOLIO_COLLECTION = "pl-prime-portfolio";
    private static final String SAFES_PORTFOLIO_COLLECTION = "pl-safes-portfolio";

    @Scheduled(fixedRate = 1000 * 3600 * 16, initialDelay = 1000) // for development - run scheduler every 16 hrs
//    @Scheduled(cron = "0 30 23 * * ?", zone = "CST") // execute scheduler every day at 11:30 PM
    public void initiateScheduler() {
        try {
            logger.info("Scheduler initiated...");

            executeRatings();
            executeSafes();
        } catch (Exception e) {
            logger.error("Error in scheduler: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void executeRatings() {
        long startTime = System.currentTimeMillis();
        try {
            logger.info("Ratings Scheduler initiated...");
            List<DataWarehousePlan> dataWarehousePlanList = primePortfolioService.getDataWarehousePlans(PortfolioType.PRIME_PORTFOLIO);
            List<DataWarehouseRx> dataWarehouseRxList = primePortfolioService.getDataWarehouseRx(PortfolioType.PRIME_PORTFOLIO);

            primePortfolioService.deletePrimePortfolioPlans(PRIME_PORTFOLIO_COLLECTION);
            logger.info("Deleted Prime Portfolio plans.");

            // insert mastermedplans in batches
            int batchSize = 1000;
            int postedMedCount = 0;
            int postedRxCount = 0;
            for (int i = 0; i < dataWarehousePlanList.size(); i += batchSize) {
                int end = Math.min(dataWarehousePlanList.size(), i + batchSize);
                postedMedCount += primePortfolioService.insertMasterMedPlans(dataWarehousePlanList.subList(i, end));
                logger.info("Inserted medical plans: " + postedMedCount);
            }

            postedRxCount  = primePortfolioService.insertRxPlans(dataWarehouseRxList);
            logger.info("Inserted rx plans: " + postedRxCount);
            logger.info(String.format("Ratings scheduler time taken: %d ms", System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void executeSafes() {
        try {
            long startTime = System.currentTimeMillis();
            logger.info("Safes Scheduler initiated...");
            List<DataWarehousePlan> dataWarehousePlanList = primePortfolioService.getDataWarehousePlans(PortfolioType.SAFES_PORTFOLIO);
            List<DataWarehouseRx> dataWarehouseRxList = primePortfolioService.getDataWarehouseRx(PortfolioType.SAFES_PORTFOLIO);

            safesPortfolioService.deleteSafesPortfolioPlans(SAFES_PORTFOLIO_COLLECTION);
            logger.info("Deleted Safes Portfolio plans.");

            Integer insertedMedicalPlans  = safesPortfolioService.insertSafesMedPlans(dataWarehousePlanList, SAFES_PORTFOLIO_COLLECTION);
            logger.info("Inserted safes medical plans: " + insertedMedicalPlans);

            Integer insertedRxPlans  = safesPortfolioService.insertSafesRxPlans(dataWarehouseRxList, SAFES_PORTFOLIO_COLLECTION);
            logger.info("Inserted safes rx plans: " + insertedRxPlans);
            logger.info(String.format("Safes scheduler time taken: %d ms", System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            logger.error("Error in safes scheduler: " + e.getMessage());
        }
    }
}
