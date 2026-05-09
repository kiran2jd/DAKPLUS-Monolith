package com.mockanytime.dakplus.auth.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.Enumeration;

@Component
public class HeaderSizeFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
            throws IOException, ServletException {
        if (request instanceof HttpServletRequest) {
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            long totalSize = 0;
            Enumeration<String> headerNames = httpRequest.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String name = headerNames.nextElement();
                String value = httpRequest.getHeader(name);
                totalSize += name.length() + value.length() + 4; // Approx size
            }
            
            if (totalSize > 8192) {
                System.out.println("WARNING: Large request detected! Headers Size: " + totalSize + " bytes. URI: " + httpRequest.getRequestURI());
                // Log individual large headers
                headerNames = httpRequest.getHeaderNames();
                while (headerNames.hasMoreElements()) {
                    String name = headerNames.nextElement();
                    String value = httpRequest.getHeader(name);
                    if (value.length() > 1000) {
                        System.out.println("  - Large Header: " + name + " (Size: " + value.length() + ")");
                    }
                }
            }
        }
        chain.doFilter(request, response);
    }
}
