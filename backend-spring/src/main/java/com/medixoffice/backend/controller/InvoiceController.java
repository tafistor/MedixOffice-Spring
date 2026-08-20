package com.medixoffice.backend.controller;

import com.medixoffice.backend.dto.MessageResponse;
import com.medixoffice.backend.dto.invoice.InvoiceCreateRequest;
import com.medixoffice.backend.dto.invoice.InvoiceResponse;
import com.medixoffice.backend.dto.invoice.InvoiceUpdateRequest;
import com.medixoffice.backend.service.InvoiceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('admin', 'secretary')")
    public ResponseEntity<InvoiceResponse> createInvoice(@Valid @RequestBody InvoiceCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(invoiceService.createInvoice(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'secretary', 'patient')")
    public List<InvoiceResponse> getInvoices() {
        return invoiceService.getInvoices();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'secretary', 'patient')")
    public InvoiceResponse getInvoiceWithDetails(@PathVariable Integer id) {
        return invoiceService.getInvoiceById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'secretary', 'patient')")
    public InvoiceResponse updateInvoice(@PathVariable Integer id, @Valid @RequestBody InvoiceUpdateRequest request) {
        return invoiceService.updateInvoice(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'secretary')")
    public MessageResponse deleteInvoice(@PathVariable Integer id) {
        invoiceService.deleteInvoice(id);
        return new MessageResponse("Invoice deleted successfully");
    }
}
