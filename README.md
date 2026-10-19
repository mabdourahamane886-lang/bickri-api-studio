# BICKRI API STUDIO

Console Next.js de Bickri Service Agency pour préparer la gestion centralisée des clés API et les tests de fournisseurs IA, avec une future intégration à BICKRI CODEX SYSTEM (BCX).

## Fonctions de cette première version
- Dashboard responsive en français, thème bleu nuit/or.
- Navigation par sections, indicateurs et catalogue initial Gemini, OpenAI, Anthropic et OpenRouter.
- Génération de clés de démonstration via une route serveur, avec affichage unique dans l'interface.
- Laboratoire qui refuse de simuler un test fournisseur non configuré.
- Validation des entrées et en-têtes de sécurité de base.

## Limites importantes
Cette version est un **socle de développement**, pas une plateforme prête pour la production. Elle ne contient pas encore d'authentification, de base de données, de stockage chiffré des clés fournisseur, de contrôle des quotas ni d'intégrations réelles. Les clés générées ne sont pas persistées et ne peuvent pas authentifier des requêtes. La génération est désactivée en production par défaut.

## Démarrer
Prérequis : Node.js 20.9+.
```bash
npm install
cp .env.example .env.local
npm run dev
```
Ouvre http://localhost:3000.

## Sécurité avant mise en production
1. Ajouter Supabase Auth et PostgreSQL avec RLS.
2. Protéger chaque route côté serveur et vérifier les rôles.
3. Stocker seulement les empreintes des clés internes.
4. Chiffrer les clés fournisseurs avec une clé de chiffrement séparée.
5. Ajouter des adaptateurs officiels, des quotas, du rate limiting, des logs sans secrets et des tests.
6. Ne jamais committer `.env.local` ou de vraies clés API.

## Déploiement
Compatible avec Vercel. Configure les variables d'environnement, active l'authentification et teste les permissions avant d'exposer l'application.
