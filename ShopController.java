package com.optum.shop.controller;

import com.optum.shop.model.SchedulerResponse;
import com.optum.shop.service.SchedulerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@AllArgsConstructor
public class ShopController {

    @Autowired
    private SchedulerService schedulerService;

    @ResponseBody
    @GetMapping(value = "/trigger-scheduler", produces = "application/json")
    @Operation(summary = "Trigger Scheduler", description = "Manually trigger the scheduler.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successful operation", content = {
                    @Content(schema = @Schema(implementation = SchedulerResponse.class))}),
            @ApiResponse(responseCode = "500", description = "Internal Server Error", content = {
                    @Content(schema = @Schema(implementation = SchedulerResponse.class))})
    })
    public ResponseEntity<Object> triggerScheduler() {
        SchedulerResponse response = new SchedulerResponse("Successfully executed scheduler.");

        try {
            schedulerService.initiateScheduler();
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (Exception e) {
            SchedulerResponse errorResponse = new SchedulerResponse("Error executing scheduler.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping(value = "/ping", produces = "application/json")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("Pong");
    }

    @GetMapping(value = "/api/v1/health", produces = "application/json")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Healthy");
    }
}
