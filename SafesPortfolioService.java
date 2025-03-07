package com.optum.shop.service;

import com.optum.shop.enums.PortfolioType;
import com.optum.shop.mongodb.model.PrimePortfolio;
import com.optum.shop.pgt.model.DataWarehousePlan;
import com.optum.shop.pgt.model.DataWarehouseRx;
import com.optum.shop.planbuilder.model.Portfolio;

import java.util.List;

public interface SafesPortfolioService {

    Integer insertSafesMedPlans(List<DataWarehousePlan> dataWarehousePlanList, String collection) throws Exception;

    Integer insertSafesRxPlans(List<DataWarehouseRx> dataWarehouseRxList, String collection) throws Exception;

    void deleteSafesPortfolioPlans(String collection) throws Exception;

    //void processPortfolioData();
}
