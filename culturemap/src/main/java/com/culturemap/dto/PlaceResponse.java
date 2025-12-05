package com.culturemap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaceResponse {
    private Long id;
    private String name;
    private String address;
    private String category;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String description;
    private Integer visitOrder;
    private LocalTime visitTime;
}

