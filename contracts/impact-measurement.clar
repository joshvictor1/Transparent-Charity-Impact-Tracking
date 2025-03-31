;; Impact Measurement Contract
;; Quantifies and reports actual outcomes

;; Data Variables
(define-map impact-metrics
  { metric-id: uint }
  {
    project-id: uint,
    name: (string-ascii 100),
    description: (string-ascii 500),
    target-value: uint,
    current-value: uint,
    unit: (string-ascii 50)
  }
)

(define-map impact-updates
  { update-id: uint }
  {
    metric-id: uint,
    old-value: uint,
    new-value: uint,
    timestamp: uint,
    reporter: principal
  }
)

(define-data-var metric-counter uint u0)
(define-data-var update-counter uint u0)
(define-map impact-reporters principal bool)

;; Access Control
(define-data-var contract-owner principal tx-sender)

(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u1))
    (var-set contract-owner new-owner)
    (ok true)
  )
)

(define-public (add-reporter (reporter principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u1))
    (map-set impact-reporters reporter true)
    (ok true)
  )
)

(define-public (remove-reporter (reporter principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u1))
    (map-delete impact-reporters reporter)
    (ok true)
  )
)

;; Impact Measurement Functions
(define-public (create-metric (project-id uint) (name (string-ascii 100)) (description (string-ascii 500)) (target-value uint) (unit (string-ascii 50)))
  (let
    (
      (new-metric-id (+ (var-get metric-counter) u1))
    )
    ;; Update metric counter
    (var-set metric-counter new-metric-id)

    ;; Create new impact metric
    (map-set impact-metrics
      { metric-id: new-metric-id }
      {
        project-id: project-id,
        name: name,
        description: description,
        target-value: target-value,
        current-value: u0,
        unit: unit
      }
    )

    ;; Return success with metric ID
    (ok new-metric-id)
  )
)

(define-public (update-metric-value (metric-id uint) (new-value uint))
  (let
    (
      (metric (unwrap! (map-get? impact-metrics { metric-id: metric-id }) (err u1)))
      (is-reporter (default-to false (map-get? impact-reporters tx-sender)))
      (current-value (get current-value metric))
      (new-update-id (+ (var-get update-counter) u1))
    )
    ;; Check if caller is a reporter
    (asserts! is-reporter (err u2))

    ;; Update metric counter
    (var-set update-counter new-update-id)

    ;; Record update
    (map-set impact-updates
      { update-id: new-update-id }
      {
        metric-id: metric-id,
        old-value: current-value,
        new-value: new-value,
        timestamp: block-height,
        reporter: tx-sender
      }
    )

    ;; Update metric value
    (map-set impact-metrics
      { metric-id: metric-id }
      (merge metric {
        current-value: new-value
      })
    )

    ;; Return success with update ID
    (ok new-update-id)
  )
)

;; Read-only Functions
(define-read-only (get-metric (metric-id uint))
  (map-get? impact-metrics { metric-id: metric-id })
)

(define-read-only (get-metric-progress (metric-id uint))
  (let
    (
      (metric (map-get? impact-metrics { metric-id: metric-id }))
    )
    (if (is-some metric)
      (let
        (
          (unwrapped-metric (unwrap-panic metric))
          (current (get current-value unwrapped-metric))
          (target (get target-value unwrapped-metric))
        )
        (if (> target u0)
          (/ (* current u100) target)
          u0
        )
      )
      u0
    )
  )
)

(define-read-only (get-update (update-id uint))
  (map-get? impact-updates { update-id: update-id })
)

