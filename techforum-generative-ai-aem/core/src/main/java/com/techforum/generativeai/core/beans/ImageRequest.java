package com.techforum.generativeai.core.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonIgnoreProperties(ignoreUnknown = true )
public class ImageRequest {

    String prompt;
    int n;
    String size;
    
}
