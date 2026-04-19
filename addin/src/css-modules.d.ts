/** Déclarations ambient pour les imports non-JS. */

// CSS modules : import style from './Foo.module.css' → style.foo typé en string
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// CSS global (import pour effet de bord uniquement)
declare module "*.css";
