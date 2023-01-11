// Alert cannot be used as a component because the Javascript from bootstrap messes with the 
// state changes and update with react

export const Alert = (message, color) => {
  if (color == null) {
    color = "danger"
  }


  return (`
    <div class="alert alert-${color} alert-dismissible fade show d-flex" role="alert">
      <span class="font-xsm">${message}</span>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    `
  )
}
