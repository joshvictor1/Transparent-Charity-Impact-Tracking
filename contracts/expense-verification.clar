;; Expense Verification Contract
;; Validates how funds are being used

;; Data Variables
(define-map expenses
  { expense-id: uint }
  {
    project-id: uint,
    amount: uint,
    recipient: principal,
    description: (string-ascii 500),
    timestamp: uint,
    verified: bool,
    verifier: (optional principal)
  }
)

(define-data-var expense-counter uint u0)
(define-map verifiers principal bool)

;; Access Control
(define-data-var contract-owner principal tx-sender)

(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u1))
    (var-set contract-owner new-owner)
    (ok true)
  )
)

(define-public (add-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u1))
    (map-set verifiers verifier true)
    (ok true)
  )
)

(define-public (remove-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u1))
    (map-delete verifiers verifier)
    (ok true)
  )
)

;; Expense Management Functions
(define-public (record-expense (project-id uint) (amount uint) (recipient principal) (description (string-ascii 500)))
  (let
    (
      (new-expense-id (+ (var-get expense-counter) u1))
    )
    ;; Update expense counter
    (var-set expense-counter new-expense-id)

    ;; Record new expense
    (map-set expenses
      { expense-id: new-expense-id }
      {
        project-id: project-id,
        amount: amount,
        recipient: recipient,
        description: description,
        timestamp: block-height,
        verified: false,
        verifier: none
      }
    )

    ;; Return success with expense ID
    (ok new-expense-id)
  )
)

(define-public (verify-expense (expense-id uint))
  (let
    (
      (expense (unwrap! (map-get? expenses { expense-id: expense-id }) (err u1)))
      (is-verifier (default-to false (map-get? verifiers tx-sender)))
    )
    ;; Check if caller is a verifier
    (asserts! is-verifier (err u2))

    ;; Check if expense is not already verified
    (asserts! (not (get verified expense)) (err u3))

    ;; Update expense as verified
    (map-set expenses
      { expense-id: expense-id }
      (merge expense {
        verified: true,
        verifier: (some tx-sender)
      })
    )

    ;; Return success
    (ok true)
  )
)

;; Read-only Functions
(define-read-only (get-expense (expense-id uint))
  (map-get? expenses { expense-id: expense-id })
)

(define-read-only (is-expense-verified (expense-id uint))
  (default-to false (get verified (map-get? expenses { expense-id: expense-id })))
)

