# BICKRI API STUDIO

Console Next.js de Bickri Service Agency pour centraliser la préparation des API IA et préparer l'intégration à BICKRI CODEX SYSTEM (BCX).

## Fonctions actuelles
- Dashboard responsive en français, thème bleu nuit et or.
- Navigation, catalogue initial Gemini, OpenAI, Anthropic et OpenRouter.
- Génération de clés de démonstration via une route serveur (non persistées, non utilisables pour authentifier des requêtes).
- Endpoint `GET /api/providers/status` qui indique si les variables fournisseur sont configurées sans révéler leurs valeurs.
- Endpoint `POST /api/providers/test` qui appelle les API officielles côté serveur lorsqu'une clé correspondante est configurée.
- Validation des entrées, délai maximal pour les requêtes fournisseur et en-têtes de sécurité de base.
- Aucun résultat fictif lorsque le fournisseur n'est pas configuré.

## Démarrer
Prérequis : Node.js 20.9+.
```bash
npm install
cp .env.example .env.local
npm run dev
```
Ouvre http://localhost:3000.

## Variables d'environnement
Configure les clés **uniquement côté serveur** : `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`. Pour OpenRouter, `APP_PUBLIC_URL` est facultative. Ne renvoie jamais ces secrets au navigateur et ne les commite jamais.

## Limites et sécurité avant production
Cette version est un socle de développement, pas encore une plateforme de production :
1. Ajouter Supabase Auth et PostgreSQL avec Row Level Security.
2. Protéger toutes les routes avec authentification et autorisation.
3. Ajouter un vrai stockage des clés internes (empreintes seulement), gestion des révocations et audit.
4. Ajouter le chiffrement authentifié des secrets fournisseur si ceux-ci sont gérés dans l'interface.
5. Ajouter quotas, limitation de débit par utilisateur, budgets, logs sans secrets et tests automatisés.
6. Ajouter un contrôle des coûts et des modèles autorisés.
7. Ne jamais activer la génération non authentifiée en production.

La génération de clés est désactivée en production. Les tests fournisseur ne fonctionnent que si les variables serveur correspondantes sont définies. Les fournisseurs peuvent facturer les requêtes de test.

## Déploiement
Compatible avec Vercel. Configure les variables d'environnement dans le projet de déploiement, puis valide le build et les permissions avant toute ouverture publique.
