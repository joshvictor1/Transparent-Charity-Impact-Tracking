;; Donation Management Contract
;; Records incoming contributions to the charity

;; Data Variables
(define-data-var total-donations uint u0)
(define-map donors principal uint)
(define-map donation-details
  { donation-id: uint }
  {
    donor: principal,
    amount: uint,
    timestamp: uint,
    project-id: (optional uint)
  }
)
(define-data-var donation-counter uint u0)

;; Public Functions
(define-public (donate (amount uint) (project-id (optional uint)))
  (let
    (
      (donor tx-sender)
      (current-donations (default-to u0 (map-get? donors donor)))
      (new-donation-id (+ (var-get donation-counter) u1))
    )
    ;; Update donation counter
    (var-set donation-counter new-donation-id)

    ;; Update total donations
    (var-set total-donations (+ (var-get total-donations) amount))

    ;; Update donor's total donations
    (map-set donors donor (+ current-donations amount))

    ;; Record donation details
    (map-set donation-details
      { donation-id: new-donation-id }
      {
        donor: donor,
        amount: amount,
        timestamp: block-height,
        project-id: project-id
      }
    )

    ;; Return success with donation ID
    (ok new-donation-id)
  )
)

;; Read-only Functions
(define-read-only (get-total-donations)
  (var-get total-donations)
)

(define-read-only (get-donor-contributions (donor principal))
  (default-to u0 (map-get? donors donor))
)

(define-read-only (get-donation-detail (donation-id uint))
  (map-get? donation-details { donation-id: donation-id })
)

